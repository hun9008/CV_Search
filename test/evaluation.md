# Evaluation

run TestCode
```
pytest evaluate.py -v
```

## Extract CV Text

Required in CV : User Personal Info, User Skill Info

/* Personal Info : 이름, 나이, 성별, 학교, 주소 */
/* Skill Info : skillset, education, project, awards, career */ 공통적으로 user 능력에 대한 정보.

How to eval : Personal Info 와 Skill Info 모두 유효해야 한다.

1. Info 존재 여부 확인 : Personal Info에 포함될 수 있는 corpus와 Skill Info에 포함될 수 있는corpus을 구축 후 corpus 포함 여부로 확인.

2. 실행 시간 : 모델 infer time이 작긴 하나, 실행 시간도 고려해야 함. 5초 이내 기준.

...

## Scraping & Crawling

seed url, sub urls.

1. sub urls valid check : seed url로 부터 생성된 sub url의 list가 1개 이상을 가지고 있고 html 형식이 맞는지 확인 (+ 404, 500 error check)

2. contents check : 직무 기반 corpus 구성 후 valid check.

하루 한번 update만 되면 되고 user 활동과는 독립으로 실행시간은 고려되지 않는다.

