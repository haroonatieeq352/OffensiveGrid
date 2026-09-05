import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Role, RoleType
from apps.scenarios.models import Category, Scenario, Flag, Difficulty, ScenarioStatus
from apps.scoring.models import SolvedScenario, UserScore


@pytest.mark.django_db
class TestFlagSubmissionsAndScoring:
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.client = APIClient()
        Role.objects.get_or_create(name=RoleType.STUDENT)
        Role.objects.get_or_create(name=RoleType.ADMIN)

        self.student = User.objects.create_user(
            email="trainee@cybergrid.io",
            username="trainee_bob",
            password="Password123!"
        )
        self.client.force_authenticate(user=self.student)

        self.category = Category.objects.create(
            name="Web Security",
            slug="web-security",
            description="Web vulnerabilities"
        )
        self.difficulty = Difficulty.objects.create(
            name="Easy",
            level_value=10,
            color_code="emerald"
        )
        self.scenario = Scenario.objects.create(
            title="SQL Injection Lab",
            slug="sql-injection-lab",
            category=self.category,
            difficulty=self.difficulty,
            points=100,
            max_attempts=3,
            description="Exploit SQLi to extract flag.",
            instructions="Target URL: http://test.lab",
            status=ScenarioStatus.PUBLISHED
        )
        self.flag = Flag.objects.create(
            scenario=self.scenario,
            flag_value="CTF{correct_flag_123}",
            is_case_sensitive=True,
            is_regex=False
        )

    def test_correct_flag_awards_points_and_records_solve(self):
        url = reverse('submissions:submit_flag')
        data = {
            "scenario_id": str(self.scenario.id),
            "flag": "CTF{correct_flag_123}"
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['is_correct'] is True
        assert response.data['data']['awarded_points'] == 100
        assert response.data['data']['total_score'] == 100

        # Check DB records
        assert SolvedScenario.objects.filter(user=self.student, scenario=self.scenario).exists()
        user_score = UserScore.objects.get(user=self.student, competition=None)
        assert user_score.total_score == 100
        assert user_score.solved_count == 1

    def test_incorrect_flag_deducts_attempt_and_awards_zero(self):
        url = reverse('submissions:submit_flag')
        data = {
            "scenario_id": str(self.scenario.id),
            "flag": "CTF{wrong_guess}"
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['is_correct'] is False
        assert response.data['data']['remaining_attempts'] == 2
        assert response.data['data']['awarded_points'] == 0

    def test_duplicate_solve_prevention(self):
        url = reverse('submissions:submit_flag')
        data = {
            "scenario_id": str(self.scenario.id),
            "flag": "CTF{correct_flag_123}"
        }
        # First solve
        res1 = self.client.post(url, data, format='json')
        assert res1.status_code == status.HTTP_200_OK

        # Second solve attempt should be rejected with 400
        res2 = self.client.post(url, data, format='json')
        assert res2.status_code == status.HTTP_400_BAD_REQUEST
        assert res2.data['success'] is False
        assert res2.data['error']['code'] == 'SCENARIO_ALREADY_SOLVED'

    def test_max_attempts_quota_exceeded(self):
        url = reverse('submissions:submit_flag')
        data = {
            "scenario_id": str(self.scenario.id),
            "flag": "CTF{wrong_attempt}"
        }
        # Attempt 1
        self.client.post(url, data, format='json')
        # Attempt 2
        self.client.post(url, data, format='json')
        # Attempt 3
        self.client.post(url, data, format='json')

        # Attempt 4 should fail with 403 ATTEMPT_LIMIT_EXCEEDED
        res4 = self.client.post(url, data, format='json')
        assert res4.status_code == status.HTTP_403_FORBIDDEN
        assert res4.data['error']['code'] == 'ATTEMPT_LIMIT_EXCEEDED'
