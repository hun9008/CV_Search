import { isUrlAllowed, isUrlAllowedWithRobots } from '../../src/url/urlUtils';


describe('URL Utils', () => {

test('isUrlAllowed - should return true for allowed URL', () => {
    const url = 'https://example.com/path/to/resource';
    const allowedDomains = ['example.com', 'another-domain.com'];
    const result = isUrlAllowed(url, allowedDomains);
    expect(result).toBe(true);
  }
);

test('isUrlAllowed - should return true for allowed URL', () => {
  const url = 'https://example.com/path/to/resource.zip';
  const allowedDomains = ['example.com', 'another-domain.com'];
  const result = isUrlAllowed(url, allowedDomains);
  expect(result).toBe(false);
}
);

test('isUrlAllowed - should return true for allowed URL', () => {
  const url = 'https://example.com/path/to/download';
  const allowedDomains = ['example.com', 'another-domain.com'];
  const result = isUrlAllowed(url, allowedDomains);
  expect(result).toBe(false);
}
);

test('isUrlAllowed - should return true for allowed URL', () => {
  const url = 'https://example.com/path/to/Filedownload';
  const allowedDomains = ['example.com', 'another-domain.com'];
  const result = isUrlAllowed(url, allowedDomains);
  expect(result).toBe(false);
}
);

test('isUrlAllowedWithRobots - should return true for allowed URL', async () => {
  const url = 'https://exapmle.com/cpx.php';
  const allowedDomains = ['exapmle.com', 'another-domain.com'];
  const result = await isUrlAllowedWithRobots(url, allowedDomains);
  expect(result).toBe(false);
}
);

test('isUrlAllowedWithRobots - should return true for allowed URL', async () => {
  const url = 'https://exapmle.com';
  const allowedDomains = ['exapmle.com', 'another-domain.com'];
  const result = await isUrlAllowedWithRobots(url, allowedDomains);
  expect(result).toBe(true);
}
);


})