FROM mysql:8.0

ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_DATABASE=goodjob
ENV MYSQL_USER=user
ENV MYSQL_PASSWORD=ajoucapstone

COPY my.cnf /etc/mysql/conf.d/my.cnf
COPY schema.sql /docker-entrypoint-initdb.d/schema.sql

EXPOSE 3306