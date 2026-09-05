import copy
from django.apps import AppConfig


def patch_django_template_context_for_python314():
    """
    Compatibility patch for Python 3.14+ where copy(super()) returns a super proxy
    that prohibits attribute mutation.
    """
    from django.template.context import BaseContext

    def base_context_copy(self):
        duplicate = object.__new__(self.__class__)
        duplicate.__dict__.update(self.__dict__)
        duplicate.dicts = self.dicts[:]
        return duplicate

    BaseContext.__copy__ = base_context_copy


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'

    def ready(self):
        patch_django_template_context_for_python314()

        # Enforce instance licensing check on server startup
        try:
            import os
            if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('DJANGO_AUTORELOAD'):
                from .licensing import verify_license_key, print_unauthorized_banner, get_machine_hardware_id
                is_valid, msg, meta = verify_license_key()
                if not is_valid:
                    print_unauthorized_banner(meta.get('hardware_id', get_machine_hardware_id()), reason=meta.get('reason', 'UNAUTHORIZED'))
        except Exception:
            pass

