from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_gateway_port: int = 8100
    internal_api_key: str = ""
    redis_url: str = "redis://localhost:6379/0"
    log_level: str = "INFO"

    # Database (same as Express backend)
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "verifywise"
    db_user: str = "postgres"
    db_password: str = ""

    # Encryption (must match Express ENCRYPTION_KEY)
    encryption_key: str = ""

    # Express backend URL (for notifications)
    backend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


settings = Settings()
