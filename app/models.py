from sqlmodel import SQLModel, Field, Relationship, DateTime
from typing import Optional, List
from datetime import datetime

'''USER MODELS'''


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    is_active: bool = False
    is_superuser: bool = False
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserRegister(SQLModel):
    email: str
    password: str
    full_name: Optional[str] = None


class UserUpdateMe(SQLModel):
    full_name: Optional[str] = None
    email: Optional[str] = None


class UserUpdate(UserBase):
    email: Optional[str] = None
    password: Optional[str] = None


class UpdatePassword(SQLModel):
    current_password: str
    new_password: str


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    services: list["CarService"] = Relationship(back_populates="owner")
    bookings: list["Booking"] = Relationship(back_populates="owner")


class UserPublic(UserBase):
    id: int


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


'''CAR MODELS'''


class CarServiceBase(SQLModel):
    name: str
    description: Optional[str] = None


class CarServiceCreate(CarServiceBase):
    pass


class CarServiceUpdate(CarServiceBase):
    pass


class CarService(CarServiceBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id", nullable=False)
    owner: Optional[User] = Relationship(back_populates="services")
    lifts: list["Lift"] = Relationship(back_populates="carservice")


class CarServicePublic(CarServiceBase):
    id: int
    owner_id: int


class CarServicesPublic(SQLModel):
    data: list[CarServicePublic]
    count: int


'''LIFT MODELS'''


class LiftBase(SQLModel):
    name: str
    carservice_id: int = Field(default=None, foreign_key="carservice.id")


class LiftCreate(LiftBase):
    pass


class LiftUpdate(LiftBase):
    pass


class Lift(LiftBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    carservice: Optional[CarService] = Relationship(back_populates="lifts")
    bookings: list["Booking"] = Relationship(back_populates="lift")


'''BOOKING MODELS'''


class BookingBase(SQLModel):
    status: str = Field(default="await_confirm")
    time_from: datetime
    time_to: datetime


class BookingCreate(BookingBase):
    lift_id: int


class BookingUpdate(BookingBase):
    pass


class BookingServices(SQLModel, table=True):
    booking_id: int = Field(foreign_key="booking.id", primary_key=True)
    service_id: int = Field(foreign_key="services.id", primary_key=True)
    booking: Optional["Booking"] = Relationship(back_populates="booking_services")
    service: Optional["Services"] = Relationship(back_populates="booking_services")


class Booking(BookingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner: Optional[User] = Relationship(back_populates="bookings")
    owner_id: int = Field(default=None, foreign_key="user.id", nullable=False)
    lift_id: int = Field(default=None, foreign_key="lift.id", nullable=False)
    lift: Optional[Lift] = Relationship(back_populates="bookings")
    booking_services: List["BookingServices"] = Relationship(back_populates="booking")


class Services(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    description: str = Field(default=None, nullable=False)
    duration: int = Field(default=None, nullable=False)
    booking_services: List["BookingServices"] = Relationship(back_populates="service")


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: Optional[int] = None


class NewPassword(SQLModel):
    token: str
    new_password: str
