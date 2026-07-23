import { sanitizeCode } from './sanitizer';

const code = `
const db = "postgres://admin:secret123@db.internal:5432/appdb";
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const userPath = "/Users/jdoe/project";
const winPath = "C:\\Users\\jdoe\\config.json";
const ip = "192.168.1.100";
const local = "127.0.0.1"; // should not match
const apiToken = "sk_live_123456789";
const myPassword = "mypassword123";
const email = "test@example.com";

VITE_MIX_RECORD_PDF_URL="http://hostname.domain.com/n/group/down/folder
MSSQL_PASSWORD=thisisone
BAMBOO_TOKEN=123312311233132
DB_USER=blabbby
DB_PASSWORD=abcde123
DB_ROOT_PASSWORD=mabcd12312
SMTP_SERVER=host.domain.com
MSSQL_HOST=INFOR-THE_SYSTEM
VITE_CM_URL='http://hostname.domain.com/group/s
SOME_FILE="test.js"
ANOTHER_URL="ftp://download.test-site.org/file.zip"
`;

function runTest() {
  console.log("Testing sanitizer...");
  const customWords = ["jdoe"];
  const tokens = sanitizeCode(code, customWords, "asterisks");

  let result = "";
  tokens.forEach(t => result += t.value);

  console.log("Original:\n", code);
  console.log("Sanitized:\n", result);
}

runTest();
