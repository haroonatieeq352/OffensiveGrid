import json
from channels.generic.websocket import AsyncWebsocketConsumer


class LeaderboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for streaming real-time leaderboard rank adjustments.
    Groups:
      - `leaderboard_global`
      - `leaderboard_competition_{slug}`
    """
    async def connect(self):
        self.competition_slug = self.scope['url_route']['kwargs'].get('competition_slug')
        if self.competition_slug:
            self.room_group_name = f"leaderboard_competition_{self.competition_slug}"
        else:
            self.room_group_name = "leaderboard_global"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Client ping/heartbeat handling
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    async def leaderboard_update(self, event):
        """
        Handler for messages pushed by background scoring tasks or submissions.
        """
        await self.send(text_data=json.dumps(event['payload']))
