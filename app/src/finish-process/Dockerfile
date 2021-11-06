FROM centos:8
RUN yum update -y
RUN yum install nodejs zip -y

WORKDIR /usr/src
COPY [ "package.json", "package-lock.json", "download.js", "upload.js", "finishprocess.sh", "./"]
COPY [ "bin/ffmpeg", "./bin/"]

RUN npm ci

CMD [ "bash", "finishprocess.sh" ]