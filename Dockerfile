FROM mysql:8.0

COPY my.cnf /etc/mysql/conf.d/my.cnf

EXPOSE 3306