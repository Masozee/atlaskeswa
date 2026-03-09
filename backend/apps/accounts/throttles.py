from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginThrottle(AnonRateThrottle):
    """
    Throttle for the login endpoint.
    Applied per IP address to prevent brute-force attacks.
    Rate defined by 'login' key in DEFAULT_THROTTLE_RATES.
    """
    scope = 'login'


class RefreshThrottle(AnonRateThrottle):
    """
    Throttle for the token refresh endpoint.
    Applied per IP address.
    Rate defined by 'refresh' key in DEFAULT_THROTTLE_RATES.
    """
    scope = 'refresh'
