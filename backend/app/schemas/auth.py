from pydantic import BaseModel, EmailStr
from app.schemas.user import UserResponse

class UserCreate(BaseModel):
    '''
    Schema for user registration
    '''
    username: str
    email: EmailStr
    password: str


class Token(BaseModel):
    '''
    Schema for JWT access token response
    '''
    access_token: str
    token_type: str
    user: UserResponse | None = None


class TokenData(BaseModel):
    '''
    Schema for data extracted from a JWT.
    '''
    user_id: int
    role: str