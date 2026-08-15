@echo off
set KCADM=d:\civic plus milestone\keycloak-26.6.4\bin\kcadm.bat

call "%KCADM%" update users/fd6c737a-c8a5-46c9-8b46-1655372bf08a -r civicpulse -s firstName=Mark -s lastName=Officer -s emailVerified=true
call "%KCADM%" update users/df56e803-8560-48b7-864b-838dc6a18db4 -r civicpulse -s firstName=Ryan -s lastName=Officer -s emailVerified=true
call "%KCADM%" update users/4aa2c2a5-e98c-478a-b6cc-4ddb84929569 -r civicpulse -s firstName=Chris -s lastName=Officer -s emailVerified=true
call "%KCADM%" update users/8db72437-33ba-4c55-bcae-564a76b87a50 -r civicpulse -s firstName=Ethan -s lastName=Officer -s emailVerified=true
call "%KCADM%" update users/ec7d78ec-5635-4ea7-9577-9bbf1a9be3c5 -r civicpulse -s firstName=Jack -s lastName=Officer -s emailVerified=true
call "%KCADM%" update users/14cf5849-6ec3-488d-850d-2303860ede17 -r civicpulse -s firstName=David -s lastName=Officer -s emailVerified=true
