FROM centos:8
RUN yum update -y
RUN yum install -y https://rpm.nodesource.com/pub_12.x/el/7/x86_64/nodesource-release-el7-1.noarch.rpm
RUN yum install -y nodejs zip

WORKDIR /usr/src
COPY [ "package.json", "package-lock.json", "getFileList.js", "upload.js", "001-postprocess.sh", "./" ]
COPY [ "bin/ffmpeg", "./bin/" ]
RUN npm ci

CMD bash /usr/src/001-postprocess.sh