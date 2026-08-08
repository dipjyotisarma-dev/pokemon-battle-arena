from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    '''
    Schema for user registration
    '''
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    '''
    Schema for user login
    '''
    username: str
    password: str


class Token(BaseModel):
    '''
    Schema for JWT access token response
    '''
    access_token: str
    token_type: str


class TokenData(BaseModel):
    '''
    Schema for data extracted from a JWT.
    '''
    user_id: int
    role: str