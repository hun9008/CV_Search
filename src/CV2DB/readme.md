```
docker run -d --name elasticsearch_goodjob \
  -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  --memory=2g \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

```
curl -X GET "http://localhost:9200/_cat/indices?v"
```

```
curl -X GET "http://localhost:9200/cv_index/_count?pretty"
curl -X GET "http://localhost:9200/job_index/_count?pretty"
```

# CV

## Save Format
1. 추출된 전체 text를 저장.
2. 1번에 대한 vector.

```
curl -X PUT "http://localhost:9200/cv_index" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "text": { "type": "text" }, 
      "vector": { "type": "dense_vector", "dims": 768 }
    }
  }
}'
```


# Jobs

## Save Format

1. 직무 정보 원본 text 전체가 저장.
2. 1번에 대한 vector.

```
curl -X PUT "http://localhost:9200/job_index" -H "Content-Type: application/json" -d '{
  "mappings": {
    "properties": {
      "text": { "type": "text" }, 
      "vector": { "type": "dense_vector", "dims": 768 }
    }
  }
}'
```
