from app.database import async_session


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
