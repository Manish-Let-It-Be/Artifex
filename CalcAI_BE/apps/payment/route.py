from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import stripe
import os

from database import get_db, User, ModelAccess, StripeSession, init_db
from constants import STRIPE_SECRET_KEY, FRONTEND_URL

stripe.api_key = STRIPE_SECRET_KEY

router = APIRouter()

# ── Model pricing map (Stripe price in cents) ─────────────────────────────────
MODEL_PRICES = {
    "gemini-2.5-pro":               {"amount": 999,  "name": "Gemini 2.5 Pro Access"},
    "gpt-4o":                       {"amount": 1499, "name": "GPT-4o Access"},
    "gpt-4o-mini":                  {"amount": 499,  "name": "GPT-4o Mini Access"},
    "claude-3-5-sonnet-20241022":   {"amount": 1499, "name": "Claude 3.5 Sonnet Access"},
}


# ── Schemas ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str

class CheckAccessRequest(BaseModel):
    email: str
    model_id: str

class CheckoutRequest(BaseModel):
    email: str
    model_id: str


# ── Auth (email-based, no password) ──────────────────────────────────────────

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Get or create a user by email."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        user = User(email=req.email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"user_id": user.id, "email": user.email}


# ── Access check ──────────────────────────────────────────────────────────────

@router.post("/check-access")
def check_access(req: CheckAccessRequest, db: Session = Depends(get_db)):
    """Check if a user has paid access to a model."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return {"has_access": False}
    access = db.query(ModelAccess).filter(
        ModelAccess.user_id == user.id,
        ModelAccess.model_id == req.model_id
    ).first()
    return {"has_access": bool(access)}


# ── Stripe Checkout ───────────────────────────────────────────────────────────

@router.post("/create-checkout")
def create_checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    """Create a Stripe Checkout session for a model."""
    if req.model_id not in MODEL_PRICES:
        raise HTTPException(status_code=400, detail="Model not available for purchase")

    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    price_info = MODEL_PRICES[req.model_id]

    # Get or create user
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        user = User(email=req.email)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Check if already has access
    existing = db.query(ModelAccess).filter(
        ModelAccess.user_id == user.id,
        ModelAccess.model_id == req.model_id
    ).first()
    if existing:
        return {"already_purchased": True}

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": price_info["name"]},
                    "unit_amount": price_info["amount"],
                },
                "quantity": 1,
            }],
            mode="payment",
            customer_email=req.email,
            success_url=f"{FRONTEND_URL}/app?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/app?payment=cancelled",
            metadata={"model_id": req.model_id, "user_email": req.email},
        )

        # Store pending session
        pending = StripeSession(
            session_id=session.id,
            user_email=req.email,
            model_id=req.model_id,
        )
        db.add(pending)
        db.commit()

        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Stripe Webhook ────────────────────────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            import json
            event = json.loads(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session_obj = event["data"]["object"]
        _fulfill_order(session_obj, db)

    return {"status": "ok"}


# ── Verify session (fallback for when webhook isn't set up) ───────────────────

@router.get("/verify-session/{session_id}")
def verify_session(session_id: str, db: Session = Depends(get_db)):
    """Poll this after redirect from Stripe to grant access."""
    pending = db.query(StripeSession).filter(
        StripeSession.session_id == session_id
    ).first()

    if not pending:
        raise HTTPException(status_code=404, detail="Session not found")

    if pending.fulfilled:
        return {"status": "fulfilled", "model_id": pending.model_id}

    # Check with Stripe directly
    try:
        stripe_session = stripe.checkout.Session.retrieve(session_id)
        if stripe_session.payment_status == "paid":
            _fulfill_order(stripe_session, db)
            return {"status": "fulfilled", "model_id": pending.model_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"status": "pending"}


# ── Get all user's purchased models ──────────────────────────────────────────

@router.get("/my-models/{email}")
def my_models(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"models": []}
    accesses = db.query(ModelAccess).filter(ModelAccess.user_id == user.id).all()
    return {"models": [a.model_id for a in accesses]}


# ── Helper ────────────────────────────────────────────────────────────────────

def _fulfill_order(stripe_session_obj, db: Session):
    session_id = stripe_session_obj["id"]
    metadata = stripe_session_obj.get("metadata", {})
    model_id = metadata.get("model_id") or stripe_session_obj.get("metadata", {}).get("model_id")
    user_email = metadata.get("user_email") or stripe_session_obj.get("customer_email")

    if not model_id or not user_email:
        return

    # Mark session fulfilled
    pending = db.query(StripeSession).filter(StripeSession.session_id == session_id).first()
    if pending and not pending.fulfilled:
        pending.fulfilled = True
        db.commit()

    # Get or create user
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        user = User(email=user_email)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Grant access if not already granted
    existing = db.query(ModelAccess).filter(
        ModelAccess.user_id == user.id,
        ModelAccess.model_id == model_id
    ).first()
    if not existing:
        access = ModelAccess(
            user_id=user.id,
            model_id=model_id,
            stripe_session_id=session_id
        )
        db.add(access)
        db.commit()
