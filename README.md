# csi350_Final
DND character sheet

Notes: Ran into issues fixing many Server errors mostly steming from the file structure arrangement. 
```
Traceback (most recent call last):
  File "/Users/tenshin/RTC_BAS/350SoftwareEngineering/Assignments/csi350_Final/server/app.py", line 26, in <module>
    from server import routes  # noqa: E402
    ^^^^^^^^^^^^^^^^^^^^^^^^^
ImportError: cannot import name 'routes' from 'server' (/Users/tenshin/RTC_BAS/350SoftwareEngineering/Assignments/csi350_Final/server/server.py)
```
# Strangest Error with Github when creating a repository

* I attemped to create a repository with github desktop a moment ago and there seemed to be an issue with the setup. While it added the server file just fine, when i tried to add the client file it was showing as empty and would error when attempting to commit the folder.

```
git rm --cached client          # unstage the embedded repo
rm -rf client/.git              # delete the nested .git folder
git add client                  # now add it as a normal directory
git commit -m "Add client app"  # commit your client code
```

# http://localhost:3000/characters
default page is the next.js demo

# core framework
Flask>=2.2.5
flask-cors>=3.0.10

# real‐time websocket support
Flask-SocketIO>=5.5.1
eventlet>=0.33.3

# environment‐variable loading
python-dotenv>=1.0.0
