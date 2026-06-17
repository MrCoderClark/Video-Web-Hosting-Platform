from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = "http://localhost:8000"
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Database (Supavisor pooler)
    pg_host: str = "127.0.0.1"
    pg_port: int = 6543
    pg_db: str = "postgres"
    pg_user: str = "postgres.your-tenant-id"
    pg_password: str = "r00tadmin"

    # Server
    backend_url: str = "http://localhost:8001"
    cors_origins: str = "http://localhost:3000"

    # FFmpeg
    ffmpeg_path: str = "ffmpeg"

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.pg_user}:{self.pg_password}@{self.pg_host}:{self.pg_port}/{self.pg_db}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
