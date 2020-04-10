from django.contrib.auth.models import User
from django.db.models import Q

class EmailAuth:
    """ Authenticate a user by an exact match on the email and password
    """
    
    def authenticate(self, username=None, password=None):
        """ Get an instance of 'User' based off the email and verify the password
        """
        try:
            users = User.objects.filter(Q(username__iexact=username) |
                                    Q(email__iexact=username)) 
            
            if not users:
                return None
    
            # Then get the first result of the query (which is your user).
            user = users[0]
                        
            # If the password is correct, return user object
            if user.check_password(password):
                return user
            return None
        except User.DoesNotExist:
            return None
            
    def get_user(self, user_id):
        """ Used by the Django authentication system to retrieve a user instance
        """
        try:
            user = User.objects.get(pk=user_id)
            
            if user.is_active:
                return user
            return None
        except User.DoesNotExist:
            return None