/**
 * Lambda: blinklean-sendNotification
 * 
 * Triggered by EventBridge on schedule.
 * Reads all FCM tokens from DynamoDB Users table and sends push
 * notifications via Firebase Cloud Messaging (FCM HTTP v1 API).
 * 
 * Integrates with DynamoDB Coupons table: scans active coupons,
 * matches keywords for holidays, and dynamically includes the coupon ID
 * and discount percentage in the notification body.
 * 
 * Uses ONLY built-in Node.js modules (crypto, https) — no npm install needed.
 *
 * Environment Variables required:
 *   FIREBASE_PROJECT_ID   = blinklean-494416
 *   FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@blinklean-494416.iam.gserviceaccount.com
 *   FIREBASE_PRIVATE_KEY  = -----BEGIN PRIVATE KEY-----\nMIIEv...  (paste full key, \n as literal \n)
 */

const https  = require('https');
const crypto = require('crypto');
const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const db = new DynamoDBClient({ region: 'ap-south-1' });

// ─── Firebase config from env vars ────────────────────────────────────────────
const PROJECT_ID   = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY  = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

// ─── Morning quotes (cycles daily) ────────────────────────────────────────────
const MORNING_QUOTES = [
  "Rise up, start fresh — see the bright opportunity in each new day. ☀️",
  "Every morning is a new beginning. Take a deep breath and start again. 🌸",
  "Good morning! The sun is shining and so are you. Make today amazing! 🌻",
  "Wake up with determination. Go to bed with satisfaction. 💪",
  "Today is a gift — that is why it is called the present. 🎁",
  "Start each day with a grateful heart. Gratitude turns what we have into enough. 🙏",
  "The secret of getting ahead is getting started. Have a wonderful morning! 🚀",
  "Mornings are the gateway to possibilities. Make the most of today! 🌈",
  "Every day is a second chance. Make it count! ✨",
  "Good morning! Be the reason someone smiles today. 😊",
  "Small steps every day lead to great distances. Keep going! 🌟",
  "Your attitude determines your direction. Choose joy this morning! 🌺",
  "A new day means new possibilities, new chances, new beginnings. 🌅",
  "Believe in yourself. You are braver than you think, stronger than you feel. 💫",
  "Today is a beautiful day to grow, learn, and inspire. 🌿",
  "Success is not final, failure is not fatal — it is the courage to continue that counts. 🦁",
  "You are stronger than you know. Have a powerful morning! ⚡",
  "Morning is where the day begins. Make every moment beautiful. 🌼",
  "Chase your dreams with a heart full of hope. Good morning! 🌠",
  "Each morning we are born again. What we do today matters most. 🕊️",
  "Let your first thought this morning be gratitude — for life, for love, for today. 🙏",
  "A positive mind finds opportunity in everything. Good morning! 🔑",
  "Be the energy you want to attract. Have a radiant morning! 💛",
  "Life is short — make it sweet. Start this morning with a smile! 🍀",
  "You were not born to be ordinary. Have an extraordinary morning! 👑",
  "Today's actions are tomorrow's results. Make them count! 🎯",
  "Dream big, work hard, stay focused. Good morning, champion! 🏆",
  "The best time for new beginnings is now. Seize the morning! 🌤️",
  "Your potential is endless. Good morning, amazing one! 💫",
  "With each sunrise comes a new story. Make yours beautiful today! 📖",
];

// ─── Night quotes (cycles daily) ─────────────────────────────────────────────
const NIGHT_QUOTES = [
  "As the stars light up the sky, let your dreams light up your night. 🌙",
  "Good night! Rest well, for tomorrow is full of beautiful possibilities. ✨",
  "Sleep is the best meditation. Have a peaceful night! 😴",
  "Tonight, let go of your worries. Tomorrow is a fresh start. 🌠",
  "You did great today. Rest now and recharge for an even better tomorrow. 💤",
  "The night is a reminder that after every darkness comes a beautiful dawn. 🌙",
  "Good night! May your dreams be as beautiful as your smile. 💫",
  "End this day with a grateful heart. You are truly blessed! 🙏",
  "Rest your mind, rest your body. Tomorrow awaits with open arms! 🌛",
  "Night is the world charging its batteries. Recharge and come back stronger! ⚡",
  "Let the stars carry your worries away tonight. Good night! 🌟",
  "Sleep tight and let your dreams inspire your tomorrow. 💭",
  "Good night! Tomorrow is another chance to shine even brighter. 🌙",
  "The day is done. Be proud of everything you accomplished today! 🌜",
  "Rest is not idleness — it is the key to a more productive tomorrow. 🔑",
  "May tonight's sleep restore your energy, your peace, and your spirit. Good night! 🕯️",
  "Close your eyes and let tomorrow's possibilities fill your dreams. 🌠",
  "Good night! Every day is a gift — and so is every good night's rest. 🎁",
  "Let peace be your companion tonight and joy your guide tomorrow. ☮&iota;",
  "The night brings calm. Embrace it and sleep well! 🌃",
  "You are loved more than you know. Sleep peacefully tonight. ❤️",
  "Good night! May you wake up refreshed, inspired, and ready to conquer! 🌅",
  "Tonight, count your blessings, not your troubles. Good night! 🙏",
  "The best bridge between despair and hope is a good night's sleep. 💛",
  "Dream big! The night is where great ideas are born. 💡",
  "Good night and sweet dreams! Tomorrow is a new adventure waiting for you. 🚀",
  "Be grateful for today — it will never come again. Good night! 🌙",
  "Tonight rest. Tomorrow rise. Always shine! ⭐",
  "May the night be gentle, and your sleep be deep and restorative. 🌊",
  "Good night! You are amazing and tomorrow will be even better! 👑",
];

// ─── Indian Government Holidays 2026 with Keywords ─────────────────────────────
// Format: 'MM-DD': { name, emoji, keywords, defaultOffer }
const HOLIDAYS_2026 = {
  '01-09': { name: 'Vivekananda Jayanti', emoji: '🧘', keywords: ['VIVEKANANDA', 'YOUTH'], defaultOffer: 'Happy Vivekananda Jayanti! "Arise, awake, and stop not till the goal is reached." Clean home, clear mind.' },
  '01-12': { name: 'Swami Vivekananda Jayanti / National Youth Day', emoji: '🌅', keywords: ['VIVEKANANDA', 'YOUTH'], defaultOffer: 'Happy National Youth Day! Channel positive energy into your home.' },
  '01-13': { name: 'Lohri', emoji: '🔥', keywords: ['LOHRI'], defaultOffer: 'Happy Lohri! May the holy fire bring warmth and happiness to your home.' },
  '01-14': { name: 'Makar Sankranti / Pongal', emoji: '🪁', keywords: ['SANKRANTI', 'PONGAL'], defaultOffer: 'Happy Makar Sankranti & Pongal! Fly high with joy and celebrate in a spotless, fresh home.' },
  '01-23': { name: 'Vasant Panchami / Netaji Jayanti', emoji: '🎻', keywords: ['VASANT', 'NETAJI', 'PANCHAMI'], defaultOffer: 'Happy Vasant Panchami & Netaji Jayanti! Welcome wisdom and courage into a pristine home.' },
  '01-26': { name: 'Republic Day', emoji: '🇮🇳', keywords: ['REPUBLIC', 'REP'], defaultOffer: 'Happy Republic Day! Celebrate India\'s heritage.' },
  '01-30': { name: 'Gandhi Punyatithi', emoji: '🙏', keywords: ['GANDHI'], defaultOffer: 'Remembering Mahatma Gandhi on his death anniversary. Let\'s commit to his vision of cleanliness.' },
  '02-01': { name: 'Guru Ravidas Jayanti', emoji: '✨', keywords: ['RAVIDAS'], defaultOffer: 'Happy Guru Ravidas Jayanti! Celebrate this holy day in a pure and clean home environment.' },
  '02-04': { name: 'World Cancer Day', emoji: '🎗️', keywords: ['CANCER', 'HEALTH'], defaultOffer: 'On World Cancer Day, we support health & hygiene. A clean home is a healthy home.' },
  '02-12': { name: 'Maharishi Dayanand Saraswati Jayanti', emoji: '📜', keywords: ['DAYANAND', 'SARASWATI'], defaultOffer: 'Happy Maharishi Dayanand Saraswati Jayanti! Embrace truth and clean living.' },
  '02-14': { name: 'Valentine\'s Day', emoji: '❤️', keywords: ['VALENTINE', 'LOVE'], defaultOffer: 'Happy Valentine\'s Day! Show your home some love. Sit back, relax, and let us clean.' },
  '02-15': { name: 'Maha Shivaratri', emoji: '🔱', keywords: ['SHIVARATRI', 'SHIVA'], defaultOffer: 'Happy Maha Shivaratri! May Lord Shiva bless your home with peace and purity.' },
  '02-19': { name: 'Chhatrapati Shivaji Maharaj Jayanti', emoji: '⚔️', keywords: ['SHIVAJI'], defaultOffer: 'Celebrating Chhatrapati Shivaji Maharaj Jayanti & Sri Ramakrishna Jayanti. Cleanliness is close to godliness.' },
  '03-03': { name: 'Holika Dahan / Chhoti Holi', emoji: '🔥', keywords: ['HOLI'], defaultOffer: 'Happy Holika Dahan! Let\'s burn away the dust and negativity. Get ready for a clean home post-Holi.' },
  '03-04': { name: 'Holi', emoji: '🎨', keywords: ['HOLI'], defaultOffer: 'Happy Holi! Celebrate with colors and joy. Don\'t worry about the mess, BlinKlean has you covered.' },
  '03-06': { name: 'Chhatrapati Shivaji Maharaj Jayanti (Samvat)', emoji: '👑', keywords: ['SHIVAJI'], defaultOffer: 'Celebrating Shivaji Maharaj Jayanti (Samvat). Keep your home royal and spotless.' },
  '03-08': { name: 'International Women\'s Day', emoji: '👩', keywords: ['WOMEN', 'WOMAN'], defaultOffer: 'Happy Women\'s Day! Gift the special women in your life a day off from chores.' },
  '03-19': { name: 'Ugadi / Gudi Padwa', emoji: '🥭', keywords: ['UGADI', 'GUDI', 'PADWA'], defaultOffer: 'Happy Ugadi & Gudi Padwa! Welcome the Hindu New Year with fresh hope and a sparkling clean home.' },
  '03-20': { name: 'Eid al-Fitr / Ramadan', emoji: '🌙', keywords: ['EID', 'RAMADAN', 'FITR'], defaultOffer: 'Eid Mubarak! Celebrate Eid al-Fitr & Ramadan with family in a beautifully clean home.' },
  '03-23': { name: 'Shaheed Diwas', emoji: '🫡', keywords: ['SHAHEED', 'MARTYR'], defaultOffer: 'Saluting our brave martyrs on Shaheed Diwas. Let\'s keep our nation and homes clean.' },
  '03-26': { name: 'Rama Navami', emoji: '🏹', keywords: ['RAMA', 'RAM'], defaultOffer: 'Happy Rama Navami! May the divine blessings of Lord Rama bring prosperity and cleanliness to your home.' },
  '03-31': { name: 'Mahavir Jayanti', emoji: '📿', keywords: ['MAHAVIR'], defaultOffer: 'Happy Mahavir Jayanti! Embrace peace, harmony, and purity in a spotless home.' },
  '04-03': { name: 'Good Friday', emoji: '✝️', keywords: ['FRIDAY', 'EASTER', 'GOOD'], defaultOffer: 'Blessed Good Friday. Refresh your home for the Easter weekend.' },
  '04-05': { name: 'Easter', emoji: '🪺', keywords: ['EASTER'], defaultOffer: 'Happy Easter! Celebrate new beginnings and spring with a fresh, clean home.' },
  '04-13': { name: 'Vallabhacharya Jayanti', emoji: '🌸', keywords: ['VALLABHACHARYA'], defaultOffer: 'Happy Vallabhacharya Jayanti! Celebrate with purity and devotion.' },
  '04-14': { name: 'Ambedkar Jayanti / Baisakhi / Solar New Year', emoji: '🌾', keywords: ['AMBEDKAR', 'BAISAKHI', 'HARVEST'], defaultOffer: 'Happy Ambedkar Jayanti, Baisakhi & Solar New Year! Celebrate new harvests and seasons in a clean home.' },
  '04-21': { name: 'Shankaracharya Jayanti', emoji: '🕉️', keywords: ['SHANKARACHARYA'], defaultOffer: 'Happy Shankaracharya Jayanti! Purity in thoughts and purity in your living space.' },
  '04-22': { name: 'Earth Day', emoji: '🌍', keywords: ['EARTH'], defaultOffer: 'Happy Earth Day! We use eco-friendly cleaning practices. Let\'s keep our planet and home green & clean.' },
  '05-01': { name: 'Buddha Purnima', emoji: '☸️', keywords: ['BUDDHA', 'WORKERS', 'LABOUR'], defaultOffer: 'Happy Buddha Purnima & Workers\' Day! Rest up and let us do the hard work today.' },
  '05-03': { name: 'World Laughter Day', emoji: '😂', keywords: ['LAUGHTER', 'SMILE'], defaultOffer: 'Happy World Laughter Day! Nothing makes you smile like a clean, stress-free home.' },
  '05-07': { name: 'Rabindranath Tagore Jayanti', emoji: '✍️', keywords: ['TAGORE', 'RABINDRANATH'], defaultOffer: 'Happy Rabindranath Tagore Jayanti! "Where the mind is without fear..." and the home is without dust.' },
  '05-10': { name: 'Mother\'s Day', emoji: '💝', keywords: ['MOTHER', 'MOM'], defaultOffer: 'Happy Mother\'s Day! Give your mother the gift of a clean house and complete rest.' },
  '05-27': { name: 'Eid al-Adha / Bakrid', emoji: '🐐', keywords: ['EID', 'ADHA', 'BAKRID'], defaultOffer: 'Eid Mubarak! Celebrate Eid al-Adha with joy and clean, welcoming spaces.' },
  '05-31': { name: 'World No Tobacco Day', emoji: '🚫', keywords: ['TOBACCO', 'HEALTH', 'SMOKE'], defaultOffer: 'Say no to smoke, say yes to fresh air and clean spaces. Clean your home and air today.' },
  '06-05': { name: 'World Environment Day', emoji: '🌱', keywords: ['ENVIRONMENT', 'GREEN'], defaultOffer: 'Happy World Environment Day! Promote healthy, clean surroundings.' },
  '06-17': { name: 'Maharana Pratap Jayanti / Islamic New Year', emoji: '🕌', keywords: ['PRATAP', 'NEWYEAR', 'HIJRI'], defaultOffer: 'Celebrating Maharana Pratap Jayanti & Islamic New Year. Step into a clean year.' },
  '06-21': { name: 'Yoga Day / Father\'s Day', emoji: '🧘\u200d\u2642\ufe0f', keywords: ['YOGA', 'FATHER', 'DAD'], defaultOffer: 'Happy Yoga Day & Father\'s Day! Treat your dad to a clean home or practice yoga in a fresh space.' },
  '06-26': { name: 'Muharram / Day of Ashura', emoji: '🕌', keywords: ['MUHARRAM', 'ASHURA'], defaultOffer: 'Observing Muharram. May the new year bring peace and purity to your home.' },
  '06-29': { name: 'Kabirdas Jayanti', emoji: '📜', keywords: ['KABIR'], defaultOffer: 'Happy Kabirdas Jayanti! Let\'s clean the mirror of our hearts and the floors of our homes.' },
  '07-16': { name: 'Jagannath Rathyatra', emoji: '🎪', keywords: ['JAGANNATH', 'RATHYATRA'], defaultOffer: 'Happy Jagannath Rathyatra! May Lord Jagannath bless your home. Cleanse your space today.' },
  '07-29': { name: 'Guru Purnima', emoji: '📿', keywords: ['GURU', 'PURNIMA'], defaultOffer: 'Happy Guru Purnima! Express gratitude to your teachers. Celebrate this sacred day in a clean, serene home.' },
  '08-02': { name: 'Friendship Day', emoji: '🤝', keywords: ['FRIEND', 'FRIENDSHIP'], defaultOffer: 'Happy Friendship Day! Share the clean love. Refer a friend and both get special discounts!' },
  '08-15': { name: 'Independence Day', emoji: '🇮🇳', keywords: ['INDEPENDENCE', 'IND', 'FREEDOM'], defaultOffer: 'Happy Independence Day! Celebrate freedom with a fresh, clean home.' },
  '08-19': { name: 'Tulsidas Jayanti', emoji: '🪔', keywords: ['TULSIDAS'], defaultOffer: 'Happy Tulsidas Jayanti! Celebrate the great poet\'s day in a clean and peaceful home.' },
  '08-26': { name: 'Onam & Eid-e-Milad', emoji: '🌸', keywords: ['ONAM', 'MILAD', 'EID'], defaultOffer: 'Happy Onam & Eid-e-Milad! Decorate your home with beautiful Pookalam and sparkling clean spaces.' },
  '08-28': { name: 'Raksha Bandhan / Rakhi', emoji: '👫', keywords: ['RAKHI', 'RAKSHA', 'SIBLING'], defaultOffer: 'Happy Raksha Bandhan! Celebrate the sibling bond. Gift your sister a sparkling clean room or home.' },
  '09-04': { name: 'Krishna Janmashtami', emoji: '🦚', keywords: ['JANMASHTAMI', 'KRISHNA', 'GOPAL'], defaultOffer: 'Happy Janmashtami! Welcome Bal Gopal to a pristine, clean, and beautifully decorated home.' },
  '09-05': { name: 'Teachers\' Day', emoji: '🧑\u200d\ud83c\udfeb', keywords: ['TEACHER'], defaultOffer: 'Happy Teachers\' Day! Saluting all teachers. Gift your favorite teacher a home cleaning service.' },
  '09-14': { name: 'Ganesh Chaturthi / Hindi Diwas', emoji: '🐘', keywords: ['GANESH', 'GANPATI', 'MORYA'], defaultOffer: 'Ganpati Bappa Morya! Welcome Lord Ganesha to a sparkling clean and decorated home.' },
  '09-15': { name: 'Engineer\'s Day', emoji: '🛠\ufe0f', keywords: ['ENGINEER'], defaultOffer: 'Happy Engineer\'s Day! Let\'s clean with precision and engineering efficiency.' },
  '09-23': { name: 'Autumnal Equinox', emoji: '🍂', keywords: ['EQUINOX', 'AUTUMN'], defaultOffer: 'Happy Autumnal Equinox! Time for a autumn cleanup.' },
  '10-02': { name: 'Gandhi Jayanti', emoji: '👓', keywords: ['GANDHI', 'BAPU'], defaultOffer: 'Happy Gandhi Jayanti! "Cleanliness is next to godliness" — Mahatma Gandhi.' },
  '10-11': { name: 'Maharaja Agrasen Jayanti', emoji: '👑', keywords: ['AGRASEN'], defaultOffer: 'Happy Maharaja Agrasen Jayanti! Celebrate in prosperity and clean surroundings.' },
  '10-19': { name: 'Durga Ashtami & Maha Navami', emoji: '🪔', keywords: ['DURGA', 'ASHTAMI', 'NAVAMI'], defaultOffer: 'Happy Durga Ashtami & Maha Navami! Let the divine power cleanse your home.' },
  '10-20': { name: 'Dussehra', emoji: '🏹', keywords: ['DUSSEHRA', 'VIJAYADASHAMI'], defaultOffer: 'Happy Dussehra! Victory of good over evil. Clean away the dirt and celebrate new beginnings.' },
  '10-21': { name: 'Madhvacharya Jayanti', emoji: '🕉\ufe0f', keywords: ['MADHVACHARYA'], defaultOffer: 'Happy Madhvacharya Jayanti! Pure home, pure mind.' },
  '10-26': { name: 'Valmiki Jayanti & Netaji netaji', emoji: '📜', keywords: ['VALMIKI'], defaultOffer: 'Happy Valmiki Jayanti! Celebrate the legendary poet with a serene and clean home environment.' },
  '10-29': { name: 'Karwa Chauth', emoji: '🌙', keywords: ['KARWA', 'CHAUTH'], defaultOffer: 'Happy Karwa Chauth! Pamper your spouse with a clean home while they fast.' },
  '11-08': { name: 'Diwali & Lakshmi Puja', emoji: '🪔', keywords: ['DIWALI', 'DEEPAVALI', 'LAKSHMI'], defaultOffer: 'Happy Diwali! Light up a sparkling clean home. Welcome Goddess Lakshmi.' },
  '11-10': { name: 'Govardhan Puja', emoji: '🐄', keywords: ['GOVARDHAN'], defaultOffer: 'Happy Govardhan Puja! May you be blessed with abundance. Keep your home fresh and clean.' },
  '11-11': { name: 'Bhaiya Dooj', emoji: '👫', keywords: ['BHAI', 'DOOJ'], defaultOffer: 'Happy Bhaiya Dooj! Celebrate the brother-sister bond in a sparkling clean home.' },
  '11-14': { name: 'Children\'s Day / Nehru Jayanti', emoji: '🎈', keywords: ['CHILDREN', 'NEHRU'], defaultOffer: 'Happy Children\'s Day! Let the kids play, we\'ll handle the mess.' },
  '11-15': { name: 'Chhath Puja', emoji: '☀️', keywords: ['CHHATH'], defaultOffer: 'Happy Chhath Puja! Celebrate the sun god in a highly clean and sanctified home.' },
  '11-24': { name: 'Guru Nanak Jayanti', emoji: '🌟', keywords: ['NANAK', 'GURU'], defaultOffer: 'Happy Guru Nanak Jayanti! May blessings shower upon your home.' },
  '12-01': { name: 'World AIDS Day', emoji: '❤️', keywords: ['AIDS', 'HEALTH'], defaultOffer: 'Supporting health and awareness on World AIDS Day. Keep your environment hygienic.' },
  '12-22': { name: 'Winter Solstice', emoji: '❄\ufe0f', keywords: ['SOLSTICE', 'WINTER'], defaultOffer: 'Happy Winter Solstice! Warm up in a cozy, clean home.' },
  '12-23': { name: 'Hazarat Ali\'s Birthday', emoji: '🕌', keywords: ['ALI'], defaultOffer: 'Happy Hazarat Ali\'s Birthday! Celebrate with peace, blessings, and a clean home.' },
  '12-25': { name: 'Christmas', emoji: '🎄', keywords: ['CHRISTMAS', 'XMAS', 'YULE'], defaultOffer: 'Merry Christmas! Gift your family a sparkling clean home.' }
};

// ─── Utility: HTTP POST helper ────────────────────────────────────────────────
function httpPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ─── Firebase: Generate JWT ────────────────────────────────────────────────────
function makeJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss:   CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(PRIVATE_KEY, 'base64url');
  return `${header}.${payload}.${sig}`;
}

// ─── Firebase: Get OAuth2 access token ────────────────────────────────────────
async function getAccessToken() {
  const jwt  = makeJWT();
  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  const res  = await httpPost({
    hostname: 'oauth2.googleapis.com',
    path:     '/token',
    method:   'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
  }, body);
  const data = JSON.parse(res.body);
  if (!data.access_token) throw new Error(`OAuth2 failed: ${res.body}`);
  return data.access_token;
}

// ─── DynamoDB: Get all FCM tokens ─────────────────────────────────────────────
async function getAllFCMTokens() {
  const tokens = [];
  let lastKey;
  do {
    const result = await db.send(new ScanCommand({
      TableName:              'Users',
      ProjectionExpression:   'fcmToken',
      FilterExpression:       'attribute_exists(fcmToken)',
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    }));
    for (const item of result.Items || []) {
      if (item.fcmToken?.S && item.fcmToken.S.length > 10) {
        tokens.push(item.fcmToken.S);
      }
    }
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return tokens;
}

// ─── DynamoDB: Get active coupons and unmarshall them ──────────────────────────
async function getActiveCoupons() {
  const coupons = [];
  let lastKey;
  try {
    do {
      const result = await db.send(new ScanCommand({
        TableName: 'Coupons',
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: { ':active': { BOOL: true } },
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {})
      }));
      
      for (const item of result.Items || []) {
        const unmarshalled = {};
        for (const [key, val] of Object.entries(item)) {
          if (val.S !== undefined) unmarshalled[key] = val.S;
          else if (val.N !== undefined) unmarshalled[key] = Number(val.N);
          else if (val.BOOL !== undefined) unmarshalled[key] = val.BOOL;
        }
        if (unmarshalled.couponId) coupons.push(unmarshalled);
      }
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);
  } catch (error) {
    console.error('[sendNotification] Error fetching active coupons from DynamoDB:', error);
  }
  return coupons;
}

// ─── DynamoDB: Get pending scheduled notifications ──────────────────────────────
async function getPendingScheduledNotifications() {
  const notifications = [];
  let lastKey;
  try {
    do {
      const result = await db.send(new ScanCommand({
        TableName: 'ScheduledNotifications',
        FilterExpression: '#status = :pending',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':pending': { S: 'pending' } },
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {})
      }));
      
      for (const item of result.Items || []) {
        const unmarshalled = {};
        for (const [key, val] of Object.entries(item)) {
          if (val.S !== undefined) unmarshalled[key] = val.S;
          else if (val.N !== undefined) unmarshalled[key] = Number(val.N);
          else if (val.BOOL !== undefined) unmarshalled[key] = val.BOOL;
        }
        if (unmarshalled.notificationId) notifications.push(unmarshalled);
      }
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);
  } catch (error) {
    console.error('[sendNotification] Error fetching pending scheduled notifications:', error);
  }
  return notifications;
}

// ─── DynamoDB: Update scheduled notification status ────────────────────────────
async function updateNotificationStatus(notificationId, status) {
  try {
    await db.send(new UpdateItemCommand({
      TableName: 'ScheduledNotifications',
      Key: {
        notificationId: { S: notificationId }
      },
      UpdateExpression: 'SET #status = :status, sentAt = :sentAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': { S: status },
        ':sentAt': { S: new Date().toISOString() }
      }
    }));
    console.log(`[sendNotification] Successfully updated status of ${notificationId} to ${status}`);
  } catch (error) {
    console.error(`[sendNotification] Error updating status of ${notificationId}:`, error);
  }
}


// ─── FCM: Send one notification ───────────────────────────────────────────────
async function sendOneFCM(accessToken, token, title, body) {
  const payload = JSON.stringify({
    message: {
      token,
      notification: { title, body },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'high_importance_channel',
          sound:      'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    },
  });
  return httpPost({
    hostname: 'fcm.googleapis.com',
    path:     `/v1/projects/${PROJECT_ID}/messages:send`,
    method:   'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  }, payload);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  console.log('[sendNotification] Event:', JSON.stringify(event));

  const type = event.type || 'morning';

  if (type === 'scheduled') {
    try {
      const pending = await getPendingScheduledNotifications();
      const nowStr = new Date().toISOString();
      const dueNotifications = pending.filter(n => n.sendAt && n.sendAt <= nowStr);
      console.log(`[sendNotification] Found ${dueNotifications.length} due scheduled notifications`);
      
      if (dueNotifications.length === 0) {
        return { statusCode: 200, body: 'No due scheduled notifications found' };
      }

      const [accessToken, tokens] = await Promise.all([getAccessToken(), getAllFCMTokens()]);
      console.log(`[sendNotification] Found ${tokens.length} FCM tokens in Users table`);

      if (tokens.length === 0) {
        return { statusCode: 200, body: 'No tokens found' };
      }

      const BATCH = 50;
      let totalSent = 0, totalFailed = 0;

      for (const notification of dueNotifications) {
        console.log(`[sendNotification] Processing due campaign "${notification.title}"`);
        let sent = 0, failed = 0;

        for (let i = 0; i < tokens.length; i += BATCH) {
          const batch = tokens.slice(i, i + BATCH);
          const results = await Promise.allSettled(
            batch.map(token => sendOneFCM(accessToken, token, notification.title, notification.body))
          );
          for (const r of results) {
            if (r.status === 'fulfilled' && r.value.status === 200) sent++;
            else failed++;
          }
        }

        console.log(`[sendNotification] Campaign "${notification.title}" complete. Sent: ${sent}, Failed: ${failed}`);
        await updateNotificationStatus(notification.notificationId, 'sent');
        totalSent += sent;
        totalFailed += failed;
      }

      return { statusCode: 200, body: JSON.stringify({ processed: dueNotifications.length, sent: totalSent, failed: totalFailed }) };
    } catch (err) {
      console.error('[sendNotification] FATAL ERROR processing scheduled notifications:', err);
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
  }

  // Determine today's index/date in IST (GMT+5:30)
  const now        = new Date();
  const utcTime    = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime    = new Date(utcTime + (3600000 * 5.5));
  
  const startOfYear = new Date(istTime.getFullYear(), 0, 0);
  const dayOfYear  = Math.floor((istTime - startOfYear) / (1000 * 60 * 60 * 24));
  
  const mm = String(istTime.getMonth() + 1).padStart(2, '0');
  const dd = String(istTime.getDate()).padStart(2, '0');
  const todayMMDD = `${mm}-${dd}`;

  // Build notification content based on type
  let title, body;

  if (type === 'morning') {
    title = '🌅 Good Morning from BlinKlean!';
    body  = MORNING_QUOTES[dayOfYear % MORNING_QUOTES.length];
  } else if (type === 'night') {
    title = '🌙 Good Night from BlinKlean!';
    body  = NIGHT_QUOTES[dayOfYear % NIGHT_QUOTES.length];
  } else if (type === 'holiday') {
    const targetDate = event.date || todayMMDD;
    const holiday = HOLIDAYS_2026[targetDate];
    if (!holiday) {
      console.log(`[sendNotification] Today (${targetDate}) is not an Indian holiday. Skipping holiday notification.`);
      return { statusCode: 200, body: `Date ${targetDate} is not a holiday. No notification sent.` };
    }
    
    title = `${holiday.emoji || '🎉'} Happy ${holiday.name}! Exclusive Offer Inside`;
    
    // Fetch coupons from database to find matching offer
    const activeCoupons = await getActiveCoupons();
    let matchedCoupon = null;

    // Filter coupons that contain holiday keywords and are not expired
    const todayStr = istTime.toISOString().split('T')[0]; // YYYY-MM-DD
    for (const coupon of activeCoupons) {
      if (coupon.validUntil && coupon.validUntil < todayStr) {
        continue; // Expired
      }
      
      const cidUpper = coupon.couponId.toUpperCase();
      const match = holiday.keywords.some(keyword => cidUpper.includes(keyword));
      if (match) {
        // Prefer coupon with higher discount if multiple match
        if (!matchedCoupon || coupon.discountPercentage > matchedCoupon.discountPercentage) {
          matchedCoupon = coupon;
        }
      }
    }

    if (matchedCoupon) {
      console.log(`[sendNotification] Matched database coupon: ${matchedCoupon.couponId} (${matchedCoupon.discountPercentage}%)`);
      body = `${holiday.defaultOffer} Celebrate with us and enjoy ${matchedCoupon.discountPercentage}% off using code ${matchedCoupon.couponId} at checkout! 🏠✨`;
    } else {
      console.log('[sendNotification] No matching active coupon found in DynamoDB. Using default offer.');
      body = `${holiday.defaultOffer} Celebrate with BlinKlean! Special offer available in the app. Open now to claim! 🏠✨`;
    }
  } else {
    console.error('Unknown type:', type);
    return { statusCode: 400, body: 'Unknown notification type' };
  }

  console.log(`[sendNotification] Type: ${type} | Title: ${title} | Body: ${body}`);

  try {
    // Get access token and FCM tokens in parallel
    const [accessToken, tokens] = await Promise.all([getAccessToken(), getAllFCMTokens()]);

    console.log(`[sendNotification] Found ${tokens.length} FCM tokens in Users table`);

    if (tokens.length === 0) {
      console.warn('[sendNotification] No FCM tokens found. Ensure app stores fcmToken in Users table.');
      return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, message: 'No tokens found' }) };
    }

    // Send in batches of 50 to avoid Lambda timeout
    const BATCH = 50;
    let sent = 0, failed = 0;

    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch   = tokens.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(token => sendOneFCM(accessToken, token, title, body))
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.status === 200) sent++;
        else failed++;
      }
      console.log(`[sendNotification] Batch ${Math.floor(i / BATCH) + 1}: sent=${sent}, failed=${failed}`);
    }

    console.log(`[sendNotification] DONE. Total sent: ${sent}, failed: ${failed}`);
    return { statusCode: 200, body: JSON.stringify({ sent, failed, title }) };

  } catch (err) {
    console.error('[sendNotification] FATAL ERROR:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
