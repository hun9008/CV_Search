docker network create elastic

# Elasticsearch 실행
docker run -d --name elasticsearch \
  --net elastic \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.10.2

# Kibana 실행
docker run -d --name kibana \
  --net elastic \
  -p 5601:5601 \
  kibana:8.10.2
