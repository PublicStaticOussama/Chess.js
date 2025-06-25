// detect-whatsapp.js
//
// npm install ipaddr.js  (light-weight IPv4/v6 helper)

const ipaddr = require('ipaddr.js');

/* ──────────────────────────────────────────────────────────────
   Meta / WhatsApp network ranges         (trimmed core blocks)
   You can add more from Meta’s published ASN sheets.
   ──────────────────────────────────────────────────────────── */
const META_IPV4 = [
  ['157.240.0.0', 16],   // fbcdn / WhatsApp
  ['179.60.192.0', 22],  // WhatsApp
  ['31.13.64.0', 18]     // Facebook
];
const META_IPV6 = [
  ['2a03:2880::', 32]    // Facebook / WhatsApp
];

/* quick CIDR check */
function inMetaRange(ip) {
  const addr   = ipaddr.parse(ip).toNormalizedString();
  const ranges = addr.includes(':') ? META_IPV6 : META_IPV4;
  return ranges.some(([net, bits]) =>
    ipaddr.parse(net).match(ipaddr.parse(addr), bits)
  );
}

function whoIsIt(req, res, next) {
  /* 1. gather fingerprints */
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

  /* 2. classify */
  const metaIP     = ip && inMetaRange(ip);
  const bizCrawler = ua.includes('bizsdk') || ua.includes('whatsapp-bizsdk');
  const verdict    = bizCrawler || metaIP ? 'whatsapp_crawler' : 'handset_or_browser';

  /* 3. descriptive console logging */
  const ts = new Date().toISOString();
  if (verdict === 'whatsapp_crawler') {
    console.log(
      `[${ts}] 🟡  WhatsApp **Business crawler** pre-fetch detected`,
      `| ip=${ip} (Meta block: ${metaIP})`,
      `| ua="${ua.slice(0, 80)}"`
    );
  } else {
    console.log(
      `[${ts}] 🟢  Normal **handset / browser** request`,
      `| ip=${ip}`,
      `| ua="${ua.slice(0, 80)}"`
    );
  }

  /* expose classification to downstream handlers if you need it */
  req.whoTriggered = verdict;
  next();
}

module.exports = whoIsIt;
