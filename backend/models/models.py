from datetime import datetime, date
import uuid
from flask_security import UserMixin, RoleMixin
import sqlalchemy as db
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, backref
from sqlalchemy import Integer, String, Boolean, DateTime, Date, Text, ForeignKey, func, UniqueConstraint, Column, Table
from werkzeug.security import generate_password_hash, check_password_hash

engine = db.create_engine("sqlite:///trekking.db")

class Base(DeclarativeBase):
    pass

roles_users = Table(
    "roles_users",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.userid", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("role.role_id", ondelete="CASCADE"), primary_key=True)
)

class Role(Base, RoleMixin):
    __tablename__ = "role"

    role_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

class User(Base, UserMixin):
    __tablename__ = "users"

    userid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    fs_uniquifier: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # Relationships
    roles = relationship("Role", secondary=roles_users, backref=backref("users", lazy="dynamic"))
    staff_profile = relationship("StaffProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    assigned_treks = relationship("Trek", back_populates="staff", passive_deletes=True)

class Trek(Base):
    __tablename__ = "treks"

    trekid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trekname: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)  
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    total_slots: Mapped[int] = mapped_column(Integer, nullable=False)
    available_slots: Mapped[int] = mapped_column(Integer, nullable=False)
    assigned_staff: Mapped[int | None] = mapped_column(ForeignKey("users.userid", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="OPEN", nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    staff = relationship("User", back_populates="assigned_treks")
    bookings = relationship("Booking", back_populates="trek", cascade="all, delete-orphan", passive_deletes=True)

class Booking(Base):
    __tablename__ = "bookings"

    bookingid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    userid: Mapped[int] = mapped_column(ForeignKey("users.userid", ondelete="CASCADE"), nullable=False)
    trekid: Mapped[int] = mapped_column(ForeignKey("treks.trekid", ondelete="CASCADE"), nullable=False)
    booking_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    booking_status: Mapped[str] = mapped_column(String(20), default="BOOKED", nullable=False) 
    completed_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("userid", "trekid", name="uq_user_trek_booking"),
    )

    user = relationship("User", back_populates="bookings")
    trek = relationship("Trek", back_populates="bookings")

class StaffProfile(Base):
    __tablename__ = "staffs"

    staffid: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    userid: Mapped[int] = mapped_column(ForeignKey("users.userid", ondelete="CASCADE"), unique=True, nullable=False)
    experience: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    approval_status: Mapped[str] = mapped_column(String(20), default="Pending", nullable=False)
    joined_on: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="staff_profile")