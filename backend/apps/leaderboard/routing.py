from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/leaderboard/$', consumers.LeaderboardConsumer.as_asgi()),
    re_path(r'^ws/leaderboard/(?P<competition_slug>[-\w]+)/$', consumers.LeaderboardConsumer.as_asgi()),
]
