import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Role, UserRole, RoleType


@pytest.mark.django_db
class TestAuthenticationAndRBAC:
    @pytest.fixture(autouse=True)
    def setup_roles_and_users(self):
        self.client = APIClient()
        
        # Create Roles
        self.student_role, _ = Role.objects.get_or_create(name=RoleType.STUDENT)
        self.admin_role, _ = Role.objects.get_or_create(name=RoleType.ADMIN)
        self.super_admin_role, _ = Role.objects.get_or_create(name=RoleType.SUPER_ADMIN)
        
        # Create Admin
        self.admin = User.objects.create_user(
            email="admin@test.com",
            username="admin_user",
            password="Password123!",
            is_staff=True
        )
        UserRole.objects.create(user=self.admin, role=self.admin_role)
        
        # Create Student
        self.student = User.objects.create_user(
            email="student@test.com",
            username="student_user",
            password="Password123!"
        )

    def test_user_registration_success(self):
        url = reverse('accounts:register')
        data = {
            "email": "newstudent@cybergrid.io",
            "username": "newstudent",
            "first_name": "John",
            "last_name": "Doe",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert 'tokens' in response.data['data']
        assert 'access' in response.data['data']['tokens']
        assert 'refresh' in response.data['data']['tokens']
        
        # Verify created in DB with student role
        user = User.objects.get(email="newstudent@cybergrid.io")
        assert user.is_student is True
        assert user.primary_role == RoleType.STUDENT

    def test_user_registration_password_mismatch(self):
        url = reverse('accounts:register')
        data = {
            "email": "mismatch@cybergrid.io",
            "username": "mismatchuser",
            "password": "Password123!",
            "confirm_password": "DifferentPassword123!",
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False

    def test_user_login_success(self):
        url = reverse('accounts:login')
        data = {
            "email": "student@test.com",
            "password": "Password123!"
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'tokens' in response.data['data']
        assert response.data['data']['user']['username'] == "student_user"

    def test_user_login_invalid_credentials(self):
        url = reverse('accounts:login')
        data = {
            "email": "student@test.com",
            "password": "WrongPassword!"
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False

    def test_get_current_user_profile(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('accounts:me')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['email'] == "student@test.com"
        assert response.data['data']['primary_role'] == RoleType.STUDENT

    def test_rbac_admin_endpoint_forbidden_for_student(self):
        self.client.force_authenticate(user=self.student)
        url = reverse('accounts:user_list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_rbac_admin_endpoint_allowed_for_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('accounts:user_list')
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
