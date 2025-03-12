module.exports = {
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './html-report', // HTML 리포트를 저장할 디렉터리 폴더 입니다
        filename: 'report.html', // 생성될 HTML 파일의 이름입니다
        openReport: true, // 테스트 종료시 HTML을 열어서 결과를 보여줍니다.
        includeFailureMsg: true, // 실패한 테스트 케이스의 실패 메시지를 포함시킵니다.
        expand: true,  // 테스트 스위트(상세 보기)를 확장할지 여부를 설정합니다.
      },
    ],
  ],
};