import os
from django.shortcuts import render, redirect, HttpResponseRedirect
from django.contrib import auth, messages
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from accounts.forms import UserLoginForm, UserRegistrationForm
from django.template.context_processors import csrf


@login_required
def logout(request):
    """ Log the user out
    """
    auth.logout(request)
    messages.success(request, "You have succesfully been logged out")
    return redirect(reverse('index'))
    
    
def login(request):
    """ Return a login page
    """
    if request.user.is_authenticated: 
        return redirect(reverse('index'))
        
    if request.method == "POST":
        login_form = UserLoginForm(request.POST)

        if login_form.is_valid():
            user = auth.authenticate(username = request.POST['username'],
                                     password = request.POST['password'])

            if user:
                auth.login(user=user, request=request)
                messages.success(request, "You have succesfully logged in!")

                if request.GET and request.GET['next'] !='':
                    next = request.GET['next']
                    return HttpResponseRedirect(next)
                else:
                    return redirect(reverse('index'))
                
            else:
                login_form.add_error(None, "Your username or password is incorrect")
                print("OK")
        
    else:
        login_form = UserLoginForm()
        
    args = {"login_form": login_form, 'next': request.GET.get('next', '')}    
    return render(request, 'login.html', args)
    

def registration(request):
    """ Render the registration page
    """
    if request.user.is_authenticated:
        return redirect(reverse('index'))
    
    if request.method == "POST":
        if os.environ.get("COMP") not in request.POST['email']:
            messages.error(request, "Not able to register here")
            return HttpResponseRedirect(reverse('registration'))

        registration_form = UserRegistrationForm(request.POST)
    
        if registration_form.is_valid():
            registration_form.save() 
    
        user = auth.authenticate(username=request.POST['username'],
                                 password=request.POST['password1'])
    
        if user:
            auth.login(user=user, request=request)
            messages.success(request, "You have succesfully registered")
            
            if request.GET and request.GET['next'] !='':
                next = request.GET['next']
                return HttpResponseRedirect(next)
            else:
                return redirect(reverse('profile'))   
        else:
            messages.error(request, "Unable to register your account at this time")
    
    else:
        registration_form = UserRegistrationForm()
        
    return render(request, 'registration.html', {
        "registration_form": registration_form})


@login_required        
def user_profile(request):
    """The user's profile page"""
    user = User.objects.get(email=request.user.email)
    return render(request, 'profile.html', {"profile": user})