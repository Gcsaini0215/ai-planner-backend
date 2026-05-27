# Flutter Dependencies Required for Backend Integration

Add these to your flutter_app/pubspec.yaml under `dependencies:`:

```yaml
dependencies:
  # HTTP client
  dio: ^5.4.3

  # Firebase
  firebase_core: ^3.1.0
  firebase_auth: ^5.1.0

  # Secure JWT storage
  flutter_secure_storage: ^9.2.2

  # (Already in project — keep)
  provider: ^6.1.2
  uuid: ^4.4.0
```

Then run:  flutter pub get
