# Docker Setup

In order for this to work docker needs to be installed on Linux you can use normal docker, on Windows and MacOS I recommend docker desktop.

1. First select your platform
Example for Windows
    If you want to change settings open `install/docker/assets/docker-compose.yml` in a text editor like Notepad.

2. After editing the environment variables like described in `docs/ENV.md` run `install\docker\setup-windows.cmd`
3. The script should build the container and you should see it in docker desktop.

Note in MacOS and Linux it's pretty much the same however you need to run './install/docker/setup-<PLATFORM>,sh'