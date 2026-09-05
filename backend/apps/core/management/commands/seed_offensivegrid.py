from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, Role, UserRole, RoleType
from apps.scenarios.models import Category, Scenario, Flag, DifficultyLevel, ScenarioStatus
from apps.competitions.models import Competition, CompetitionScenario, CompetitionStatus
from apps.scoring.models import UserScore


class Command(BaseCommand):
    help = "Seeds initial database roles, administrator, student trainee, categories, scenarios, and competitions for OffensiveGrid."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initializing OffensiveGrid seed data..."))

        # 1. Seed Roles
        role_definitions = [
            (RoleType.SUPER_ADMIN, "Global system administrator with unrestricted privileges."),
            (RoleType.ADMIN, "Platform administrator managing scenarios, competitions, and trainees."),
            (RoleType.INSTRUCTOR, "Instructor authoring scenarios and reviewing student performance."),
            (RoleType.STUDENT, "Trainee student accessing challenges, submitting flags, and competing."),
        ]
        roles = {}
        for role_name, desc in role_definitions:
            role_obj, created = Role.objects.get_or_create(
                name=role_name,
                defaults={'description': desc}
            )
            roles[role_name] = role_obj
            status = "Created" if created else "Existing"
            self.stdout.write(f"  [Role] {role_name}: {status}")

        # 2. Seed Default Admin
        admin_user, admin_created = User.objects.get_or_create(
            email="admin@cszone.io",
            defaults={
                'username': 'admin',
                'first_name': 'Sarah',
                'last_name': 'Connor',
                'is_staff': True,
                'is_superuser': True,
                'is_verified': True,
            }
        )
        if admin_created:
            admin_user.set_password("admin12345")
            admin_user.save()
            UserRole.objects.get_or_create(user=admin_user, role=roles[RoleType.SUPER_ADMIN])
            self.stdout.write(self.style.SUCCESS("  [User] Admin created: admin@cszone.io (pass: admin12345)"))
        else:
            self.stdout.write("  [User] Admin existing: admin@cszone.io")

        # 3. Seed Default Student Trainee
        student_user, student_created = User.objects.get_or_create(
            email="student@cszone.io",
            defaults={
                'username': 'trainee1',
                'first_name': 'Alex',
                'last_name': 'Mercer',
                'is_verified': True,
            }
        )
        if student_created:
            student_user.set_password("student12345")
            student_user.save()
            UserRole.objects.get_or_create(user=student_user, role=roles[RoleType.STUDENT])
            self.stdout.write(self.style.SUCCESS("  [User] Student created: student@cszone.io (pass: student12345)"))
        else:
            self.stdout.write("  [User] Student existing: student@cszone.io")

        # 4. Seed Categories
        categories_data = [
            ("Web Exploitation", "web-exploitation", "Exploit SQLi, XSS, SSRF, CSRF, and authentication flaws in modern web apps.", "Globe"),
            ("Network Forensics", "network-forensics", "Analyze PCAP packet captures, detect exfiltration, and reconstruct network sessions.", "Wifi"),
            ("Cryptography", "cryptography", "Crack classical ciphers, analyze RSA keys, and exploit cryptographic weaknesses.", "Key"),
            ("Binary Exploitation", "binary-exploitation", "Analyze binaries, identify buffer overflows, format string bugs, and ROP chains.", "Terminal"),
            ("OSINT & Recon", "osint-recon", "Gather intelligence from open source data, company leaks, and metadata trails.", "Search"),
            ("Reverse Engineering", "reverse-engineering", "Decompile x86/ARM executables, bypass anti-debugging, and recover hidden keys.", "Cpu"),
        ]
        categories = {}
        for name, slug, desc, icon in categories_data:
            cat_obj, _ = Category.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'description': desc, 'icon': icon}
            )
            categories[slug] = cat_obj
            self.stdout.write(f"  [Category] {name}")

        # 5. Seed Realistic CTF Scenarios
        scenarios_data = [
            {
                "title": "SQL Injection Gateway",
                "slug": "sql-injection-gateway",
                "category": categories["web-exploitation"],
                "difficulty": DifficultyLevel.EASY,
                "points": 100,
                "target_url": "http://lab.cszone.io:8081/login",
                "max_attempts": 5,
                "description": "Bypass an insecure authentication portal using classic SQL injection syntax.",
                "instructions": """### Mission Briefing
A legacy administrative portal has been deployed by CyberCorp. The authentication handler incorporates unsanitized user inputs into a raw SQL query.

#### Objectives:
1. Navigate to the target portal: `http://lab.cszone.io:8081/login`
2. Formulate a payload that forces the SQL expression to evaluate to `TRUE` (e.g. `' OR '1'='1`).
3. Extract the secret flag from the administrator welcome dashboard.

#### Flag Format:
`CTF{...}`
""",
                "flag": "CTF{sql_1nj3ct10n_m4st3r}",
            },
            {
                "title": "JWT Signature Bypass",
                "slug": "jwt-signature-bypass",
                "category": categories["web-exploitation"],
                "difficulty": DifficultyLevel.MEDIUM,
                "points": 250,
                "target_url": "http://lab.cszone.io:8082/api/profile",
                "max_attempts": 5,
                "description": "Forge an administrative session token by exploiting algorithm confusion in JWT verification.",
                "instructions": """### Mission Briefing
The target API server verifies JSON Web Tokens but improperly trusts tokens configured with the `none` algorithm or weak HMAC keys.

#### Objectives:
1. Intercept your trainee JWT bearer token using Burp Suite or browser DevTools.
2. Decode the header and payload. Modify the role claim from `"role": "trainee"` to `"role": "admin"`.
3. Set the algorithm header to `none` (or resign with the leaked secret key).
4. Send a request to `/api/admin/flag` to capture the secret flag.
""",
                "flag": "CTF{jwt_n0n3_4lg_byp4ss}",
            },
            {
                "title": "Network Packet PCAP Analysis",
                "slug": "network-packet-pcap-analysis",
                "category": categories["network-forensics"],
                "difficulty": DifficultyLevel.MEDIUM,
                "points": 300,
                "target_url": None,
                "max_attempts": 5,
                "description": "Analyze network traffic capture to uncover an attacker's covert FTP exfiltration session.",
                "instructions": """### Mission Briefing
A critical server detected suspicious outbound network transmission before going offline. A 10MB PCAP file was captured at the edge firewall.

#### Objectives:
1. Download the scenario dossier PCAP attachment from the assets section.
2. Open the capture file in Wireshark or `tshark`.
3. Filter traffic for unencrypted protocols (`ftp`, `http`, `telnet`).
4. Reassemble the TCP stream containing the exfiltrated credential document to locate the flag.
""",
                "flag": "CTF{w1r3sh4rk_p4ck3t_sn1ff3r}",
            },
            {
                "title": "Caesar & Base64 Multi-Layer",
                "slug": "caesar-and-base64-multilayer",
                "category": categories["cryptography"],
                "difficulty": DifficultyLevel.EASY,
                "points": 100,
                "target_url": None,
                "max_attempts": 0,
                "description": "Decode multi-stage classical substitution and encoding layers to retrieve the plaintext flag.",
                "instructions": """### Mission Briefing
A malicious actor left behind an obfuscated string during a reconnaissance probe:
`UVpCUlJKe3I0M3M0cl9jMXBoM3JfY3I0Y2szZH0=` (Layer 1 Base64 -> Layer 2 ROT-13)

#### Objectives:
1. Base64 decode the intercept.
2. Apply the inverse Caesar shift (ROT13).
3. Verify the standard `CTF{...}` envelope.
""",
                "flag": "CTF{c43s4r_c1ph3r_cr4ck3d}",
            },
            {
                "title": "Corporate Breached Intel OSINT",
                "slug": "corporate-breached-intel-osint",
                "category": categories["osint-recon"],
                "difficulty": DifficultyLevel.EASY,
                "points": 150,
                "target_url": None,
                "max_attempts": 3,
                "description": "Correlate public breach archives, DNS TXT records, and GitHub commits to discover the leaked token.",
                "instructions": """### Mission Briefing
CyberCorp's security team noticed unauthorized API queries against their cloud assets. Locate the exposed secret flag in their public GitHub commit history.

#### Objectives:
1. Inspect the public repository commits.
2. Identify the commit where credentials were accidentally staged before being deleted in a subsequent fix.
3. Recover the hidden flag token.
""",
                "flag": "CTF{0s1nt_r3c0n_succ3ss}",
            },
        ]

        created_scenarios = []
        for sdata in scenarios_data:
            scenario_obj, s_created = Scenario.objects.get_or_create(
                slug=sdata["slug"],
                defaults={
                    "title": sdata["title"],
                    "category": sdata["category"],
                    "difficulty": sdata["difficulty"],
                    "points": sdata["points"],
                    "target_url": sdata.get("target_url"),
                    "max_attempts": sdata.get("max_attempts", 0),
                    "description": sdata["description"],
                    "instructions": sdata["instructions"],
                    "status": ScenarioStatus.PUBLISHED,
                    "created_by": admin_user,
                }
            )
            created_scenarios.append(scenario_obj)
            Flag.objects.get_or_create(
                scenario=scenario_obj,
                flag_value=sdata["flag"],
                defaults={'is_case_sensitive': True, 'is_regex': False}
            )
            self.stdout.write(f"  [Scenario] {scenario_obj.title} ({scenario_obj.points} pts)")

        # 6. Seed Sample Live Tournament / Competition
        now = timezone.now()
        competition_obj, comp_created = Competition.objects.get_or_create(
            slug="offensivegrid-national-championship-2026",
            defaults={
                "title": "OffensiveGrid National Championship 2026",
                "description": "Premier cybersecurity tournament featuring Web, Forensics, and Crypto attack-defense scenarios.",
                "start_time": now - timedelta(hours=1),
                "end_time": now + timedelta(hours=5),
                "status": CompetitionStatus.ACTIVE,
                "is_public": True,
                "created_by": admin_user,
            }
        )
        if comp_created or competition_obj.scenarios.count() == 0:
            for idx, sc in enumerate(created_scenarios, start=1):
                CompetitionScenario.objects.get_or_create(
                    competition=competition_obj,
                    scenario=sc,
                    defaults={'order_index': idx}
                )
            self.stdout.write(self.style.SUCCESS(f"  [Competition] {competition_obj.title} (ACTIVE)"))

        self.stdout.write(self.style.SUCCESS("OffensiveGrid seed completed successfully!"))
