const OUI_TABLE: Record<string, string> = {
  // Apple
  '00:03:93': 'Apple', '00:05:02': 'Apple', '00:0A:27': 'Apple', '00:0A:95': 'Apple',
  '00:0D:93': 'Apple', '00:10:FA': 'Apple', '00:11:24': 'Apple', '00:14:51': 'Apple',
  '00:16:CB': 'Apple', '00:17:F2': 'Apple', '00:19:E3': 'Apple', '00:1B:63': 'Apple',
  '00:1C:B3': 'Apple', '00:1D:4F': 'Apple', '00:1E:52': 'Apple', '00:1E:C2': 'Apple',
  '00:1F:5B': 'Apple', '00:1F:F3': 'Apple', '00:21:E9': 'Apple', '00:22:41': 'Apple',
  '00:23:12': 'Apple', '00:23:32': 'Apple', '00:23:6C': 'Apple', '00:23:DF': 'Apple',
  '00:24:36': 'Apple', '00:25:00': 'Apple', '00:25:4B': 'Apple', '00:25:BC': 'Apple',
  '00:26:08': 'Apple', '00:26:4A': 'Apple', '00:26:B0': 'Apple', '00:26:BB': 'Apple',
  '00:30:65': 'Apple', '00:3E:E1': 'Apple', '00:50:E4': 'Apple', '00:56:CD': 'Apple',
  '00:61:71': 'Apple', '00:6D:52': 'Apple', '00:88:65': 'Apple', '00:B3:62': 'Apple',
  '00:C6:10': 'Apple', '00:CD:FE': 'Apple', '00:DB:70': 'Apple', '00:F4:B9': 'Apple',
  '00:F7:6F': 'Apple', '04:0C:CE': 'Apple', '04:15:52': 'Apple', '04:26:65': 'Apple',
  '04:48:9A': 'Apple', '04:4B:ED': 'Apple', '04:52:F3': 'Apple', '04:54:53': 'Apple',
  '04:D3:CF': 'Apple', '04:DB:56': 'Apple', '04:E5:36': 'Apple', '04:F1:3E': 'Apple',
  '04:F7:E4': 'Apple', '08:66:98': 'Apple', '08:6D:41': 'Apple', '0C:3E:9F': 'Apple',
  '0C:4D:E9': 'Apple', '0C:74:C2': 'Apple', '0C:BC:9F': 'Apple', '10:40:F3': 'Apple',
  '10:DD:B1': 'Apple', '14:10:9F': 'Apple', '14:5A:05': 'Apple', '14:99:E2': 'Apple',
  '18:20:32': 'Apple', '18:34:51': 'Apple', '18:AF:61': 'Apple', '18:E7:F4': 'Apple',
  '1C:36:BB': 'Apple', '1C:91:48': 'Apple', '1C:E6:2B': 'Apple', '20:3C:AE': 'Apple',
  '20:78:F0': 'Apple', '20:A2:E4': 'Apple', '20:AB:37': 'Apple', '24:24:0E': 'Apple',
  '24:A0:74': 'Apple', '24:AB:81': 'Apple', '24:F6:77': 'Apple', '28:0B:5C': 'Apple',
  '28:37:37': 'Apple', '28:6A:B8': 'Apple', '28:6A:BA': 'Apple', '28:CF:DA': 'Apple',
  '28:CF:E9': 'Apple', '28:E0:2C': 'Apple', '28:E1:4C': 'Apple', '28:ED:6A': 'Apple',
  '28:F0:76': 'Apple', '2C:B4:3A': 'Apple', '2C:BE:08': 'Apple', '2C:F0:EE': 'Apple',
  '30:10:E4': 'Apple', '30:35:AD': 'Apple', '30:63:6B': 'Apple', '30:90:AB': 'Apple',
  '34:08:BC': 'Apple', '34:12:98': 'Apple', '34:36:3B': 'Apple', '34:C0:59': 'Apple',
  '34:E2:FD': 'Apple', '38:0F:4A': 'Apple', '38:48:4C': 'Apple', '38:53:9C': 'Apple',
  '38:66:F0': 'Apple', '38:C9:86': 'Apple', '38:CA:DA': 'Apple', '3C:07:54': 'Apple',
  '3C:15:C2': 'Apple', '3C:22:FB': 'Apple', '3C:E0:72': 'Apple', '40:30:04': 'Apple',
  '40:33:1A': 'Apple', '40:4D:7F': 'Apple', '40:6C:8F': 'Apple', '40:A6:D9': 'Apple',
  '40:B3:95': 'Apple', '40:D3:2D': 'Apple', '44:00:10': 'Apple', '44:2A:60': 'Apple',
  '44:D8:84': 'Apple', '48:43:7C': 'Apple', '48:60:BC': 'Apple', '48:74:6E': 'Apple',
  '48:A9:1C': 'Apple', '48:BF:6B': 'Apple', '48:D7:05': 'Apple', '48:E9:F1': 'Apple',

  // Google
  '00:1A:11': 'Google', '08:9E:08': 'Google', '14:C1:4E': 'Google', '20:DF:B9': 'Google',
  '30:FD:38': 'Google', '3C:5A:B4': 'Google', '48:D6:D5': 'Google', '54:60:09': 'Google',
  '58:CB:52': 'Google', '6C:AD:F8': 'Google', '70:03:7E': 'Google', '7C:2E:BD': 'Google',
  '94:EB:2C': 'Google', 'A4:77:33': 'Google', 'A4:C0:E1': 'Google', 'D4:F5:47': 'Google',
  'E4:F0:42': 'Google', 'F4:F5:D8': 'Google', 'F4:F5:E8': 'Google', 'F8:0F:F9': 'Google',

  // Amazon
  '00:71:47': 'Amazon', '00:FC:8B': 'Amazon', '0C:47:C9': 'Amazon', '10:2C:6B': 'Amazon',
  '14:91:82': 'Amazon', '18:74:2E': 'Amazon', '28:F3:66': 'Amazon', '34:D2:70': 'Amazon',
  '38:F7:3D': 'Amazon', '40:A2:DB': 'Amazon', '44:00:49': 'Amazon', '4C:EF:C0': 'Amazon',
  '50:DC:E7': 'Amazon', '5C:41:5A': 'Amazon', '68:37:E9': 'Amazon', '68:54:FD': 'Amazon',
  '6C:56:97': 'Amazon', '74:C2:46': 'Amazon', '78:E1:03': 'Amazon', '84:D6:D0': 'Amazon',
  '8C:AE:4C': 'Amazon', 'A0:02:DC': 'Amazon', 'AC:63:BE': 'Amazon', 'B0:FC:0D': 'Amazon',
  'B4:7C:9C': 'Amazon', 'C8:3D:DC': 'Amazon', 'CC:9E:A2': 'Amazon', 'F0:27:2D': 'Amazon',
  'F0:F0:A4': 'Amazon', 'FC:65:DE': 'Amazon', 'FC:A1:83': 'Amazon',

  // Samsung
  '00:00:F0': 'Samsung', '00:02:78': 'Samsung', '00:07:AB': 'Samsung', '00:09:18': 'Samsung',
  '00:0D:E5': 'Samsung', '00:12:47': 'Samsung', '00:12:FB': 'Samsung', '00:13:77': 'Samsung',
  '00:15:99': 'Samsung', '00:16:32': 'Samsung', '00:16:6B': 'Samsung', '00:16:6C': 'Samsung',
  '00:17:C9': 'Samsung', '00:17:D5': 'Samsung', '00:18:AF': 'Samsung', '00:1A:8A': 'Samsung',
  '00:1B:98': 'Samsung', '00:1C:43': 'Samsung', '00:1D:25': 'Samsung', '00:1D:F6': 'Samsung',
  '00:1E:7D': 'Samsung', '00:1E:E1': 'Samsung', '00:1E:E2': 'Samsung', '00:1F:CC': 'Samsung',
  '00:1F:CD': 'Samsung', '00:21:19': 'Samsung', '00:21:4C': 'Samsung', '00:21:D1': 'Samsung',
  '00:21:D2': 'Samsung', '00:23:39': 'Samsung', '00:23:3A': 'Samsung', '00:23:99': 'Samsung',
  '00:23:D6': 'Samsung', '00:23:D7': 'Samsung', '00:24:54': 'Samsung', '00:24:90': 'Samsung',
  '00:24:91': 'Samsung', '00:24:E9': 'Samsung', '00:25:66': 'Samsung', '00:25:67': 'Samsung',
  '00:26:37': 'Samsung', '00:26:5D': 'Samsung', '00:26:5F': 'Samsung', '04:18:0F': 'Samsung',
  '08:08:C2': 'Samsung', '08:D4:2B': 'Samsung', '08:EE:8B': 'Samsung', '0C:71:5D': 'Samsung',
  '10:1D:C0': 'Samsung', '14:49:E0': 'Samsung', '14:56:8E': 'Samsung', '18:3A:2D': 'Samsung',
  '18:67:B0': 'Samsung', '1C:62:B8': 'Samsung', '1C:66:AA': 'Samsung', '20:13:E0': 'Samsung',
  '24:4B:03': 'Samsung', '28:BA:B5': 'Samsung', '2C:AE:2B': 'Samsung', '30:CD:A7': 'Samsung',
  '34:14:5F': 'Samsung', '38:01:97': 'Samsung', '38:0A:94': 'Samsung', '38:2D:D1': 'Samsung',
  '3C:5A:37': 'Samsung', '3C:62:00': 'Samsung', '40:16:3B': 'Samsung', '44:78:3E': 'Samsung',

  // LG Electronics
  '00:05:C9': 'LG Electronics', '00:0B:E9': 'LG Electronics', '00:1C:62': 'LG Electronics',
  '00:1E:75': 'LG Electronics', '00:1F:6B': 'LG Electronics', '00:1F:E3': 'LG Electronics',
  '00:22:A9': 'LG Electronics', '00:24:83': 'LG Electronics', '00:26:E2': 'LG Electronics',
  '00:34:DA': 'LG Electronics', '00:AA:70': 'LG Electronics', '00:E0:91': 'LG Electronics',
  '08:D4:6A': 'LG Electronics', '10:4F:A8': 'LG Electronics', '14:C9:13': 'LG Electronics',
  '20:3D:BD': 'LG Electronics', '28:84:FA': 'LG Electronics', '2C:54:CF': 'LG Electronics',
  '30:8C:FB': 'LG Electronics', '34:4D:F7': 'LG Electronics', '38:8B:59': 'LG Electronics',
  '3C:BD:D8': 'LG Electronics', '40:B8:9A': 'LG Electronics', '44:07:1B': 'LG Electronics',
  '48:59:29': 'LG Electronics', '4C:BC:A5': 'LG Electronics', '50:55:27': 'LG Electronics',
  '58:A2:B5': 'LG Electronics', '5C:A3:9D': 'LG Electronics', '64:99:5D': 'LG Electronics',
  '6C:E8:73': 'LG Electronics', '78:F8:82': 'LG Electronics', '88:C9:D0': 'LG Electronics',
  '8C:3A:E3': 'LG Electronics', '98:D6:F7': 'LG Electronics', 'A8:16:B2': 'LG Electronics',
  'A8:23:FE': 'LG Electronics', 'B4:E6:2A': 'LG Electronics', 'BC:F5:AC': 'LG Electronics',
  'C4:36:6C': 'LG Electronics', 'C4:9A:02': 'LG Electronics', 'CC:2D:83': 'LG Electronics',

  // Sony
  '00:01:4A': 'Sony', '00:04:1F': 'Sony', '00:0A:D9': 'Sony', '00:0E:07': 'Sony',
  '00:13:A9': 'Sony', '00:15:C1': 'Sony', '00:18:13': 'Sony', '00:19:63': 'Sony',
  '00:1A:80': 'Sony', '00:1D:0D': 'Sony', '00:1E:A4': 'Sony', '00:1F:E4': 'Sony',
  '00:21:9E': 'Sony', '00:23:F1': 'Sony', '00:24:8D': 'Sony', '00:EB:2D': 'Sony',
  '04:5D:4B': 'Sony', '08:A9:5A': 'Sony', '28:3F:69': 'Sony',
  '2C:33:61': 'Sony', '30:17:C8': 'Sony', '40:B8:37': 'Sony', '44:74:6C': 'Sony',
  '54:42:49': 'Sony', '58:48:22': 'Sony', '70:9E:29': 'Sony', '78:84:3C': 'Sony',
  '84:00:D2': 'Sony', 'A0:E4:53': 'Sony', 'AC:9B:0A': 'Sony', 'B0:52:16': 'Sony',
  'B4:52:7E': 'Sony', 'BC:60:A7': 'Sony', 'C8:63:F1': 'Sony', 'FC:F1:52': 'Sony',

  // Sonos
  '00:0E:58': 'Sonos', '09:17:2E': 'Sonos', '34:7E:5C': 'Sonos', '48:A6:B8': 'Sonos',
  '54:2A:1B': 'Sonos', '5C:AA:FD': 'Sonos', '78:28:CA': 'Sonos', '7C:35:4B': 'Sonos',
  '94:9F:3E': 'Sonos', 'B8:E9:37': 'Sonos', 'C4:38:75': 'Sonos',

  // Signify (Philips Hue/Lighting)
  '00:17:88': 'Signify', 'EC:B5:FA': 'Signify',

  // Roku
  '00:0D:4B': 'Roku', '08:05:81': 'Roku', '10:59:32': 'Roku', '20:EF:BD': 'Roku',
  '34:8A:7B': 'Roku', '44:2C:05': 'Roku', '4C:37:73': 'Roku', '58:8D:09': 'Roku',
  '84:EA:ED': 'Roku', '8C:49:62': 'Roku', 'AC:3A:7A': 'Roku', 'B0:A7:37': 'Roku',
  'B8:3E:59': 'Roku', 'C8:3A:6B': 'Roku', 'CC:6D:A0': 'Roku', 'D4:E2:2F': 'Roku',
  'D8:31:34': 'Roku', 'DC:3A:5E': 'Roku',

  // Espressif (ESP8266/ESP32)
  '08:3A:F2': 'Espressif', '0C:DC:7E': 'Espressif', '10:52:1C': 'Espressif',
  '18:FE:34': 'Espressif', '24:0A:C4': 'Espressif', '24:62:AB': 'Espressif',
  '24:6F:28': 'Espressif', '24:A1:60': 'Espressif', '24:B2:DE': 'Espressif',
  '2C:F4:32': 'Espressif', '30:AE:A4': 'Espressif', '30:C6:F7': 'Espressif',
  '34:85:18': 'Espressif', '34:86:5D': 'Espressif', '34:AB:95': 'Espressif',
  '34:B4:72': 'Espressif', '3C:61:05': 'Espressif', '3C:71:BF': 'Espressif',
  '40:22:D8': 'Espressif', '40:F5:20': 'Espressif', '48:3F:DA': 'Espressif',
  '48:55:19': 'Espressif', '4C:11:AE': 'Espressif', '4C:75:25': 'Espressif',
  '5C:CF:7F': 'Espressif', '60:01:94': 'Espressif', '68:C6:3A': 'Espressif',
  '70:04:1D': 'Espressif', '78:21:84': 'Espressif', '78:E3:6D': 'Espressif',
  '7C:9E:BD': 'Espressif', '7C:DF:A1': 'Espressif', '80:7D:3A': 'Espressif',
  '84:0D:8E': 'Espressif', '84:CC:A8': 'Espressif', '84:F3:EB': 'Espressif',
  '8C:AA:B5': 'Espressif', '90:38:0C': 'Espressif', '94:3C:C6': 'Espressif',
  '94:B5:55': 'Espressif', '94:B9:7E': 'Espressif', '98:CD:AC': 'Espressif',
  '98:F4:AB': 'Espressif', 'A0:20:A6': 'Espressif', 'A4:7B:9D': 'Espressif',
  'A4:CF:12': 'Espressif', 'A8:03:2A': 'Espressif', 'A8:48:FA': 'Espressif',
  'AC:67:B2': 'Espressif', 'B4:E6:2D': 'Espressif', 'B8:F0:09': 'Espressif',
  'BC:DD:C2': 'Espressif', 'BC:FF:4D': 'Espressif', 'C4:4F:33': 'Espressif',
  'C4:5B:BE': 'Espressif', 'C8:2B:96': 'Espressif', 'C8:C9:A3': 'Espressif',
  'CC:50:E3': 'Espressif', 'CC:DB:A7': 'Espressif', 'D4:8A:FC': 'Espressif',
  'D8:A0:1D': 'Espressif', 'D8:BF:C0': 'Espressif', 'DC:4F:22': 'Espressif',
  'E0:98:06': 'Espressif', 'E8:DB:84': 'Espressif', 'EC:FA:BC': 'Espressif',
  'F0:08:D1': 'Espressif', 'F4:CF:A2': 'Espressif', 'FC:F5:C4': 'Espressif',

  // TP-Link
  '00:27:19': 'TP-Link', '00:31:92': 'TP-Link', '08:10:77': 'TP-Link',
  '10:FE:ED': 'TP-Link', '14:CC:20': 'TP-Link',
  '18:A6:F7': 'TP-Link', '1C:3B:F3': 'TP-Link', '24:69:68': 'TP-Link',
  '30:B4:9E': 'TP-Link', '38:BC:01': 'TP-Link', '40:ED:00': 'TP-Link',
  '48:22:54': 'TP-Link', '50:3E:AA': 'TP-Link', '50:C7:BF': 'TP-Link',
  '54:AF:97': 'TP-Link', '58:91:CF': 'TP-Link', '5C:A6:E6': 'TP-Link',
  '5C:E9:31': 'TP-Link', '60:32:B1': 'TP-Link', '60:E3:27': 'TP-Link',
  '64:56:01': 'TP-Link', '64:70:02': 'TP-Link', '68:FF:7B': 'TP-Link',
  '6C:5A:B0': 'TP-Link', '70:4F:57': 'TP-Link', '74:DA:88': 'TP-Link',
  '78:8C:B5': 'TP-Link', '7C:8B:CA': 'TP-Link', '80:8F:1D': 'TP-Link',
  '84:16:F9': 'TP-Link', '88:25:93': 'TP-Link', '90:9A:4A': 'TP-Link',
  '94:D9:B3': 'TP-Link', '98:DA:C4': 'TP-Link', '9C:21:6A': 'TP-Link',
  'A4:2B:B0': 'TP-Link', 'A8:57:4E': 'TP-Link', 'AC:84:C6': 'TP-Link',
  'B0:4E:26': 'TP-Link', 'B0:95:75': 'TP-Link', 'B0:BE:76': 'TP-Link',
  'B4:B0:24': 'TP-Link', 'C0:06:C3': 'TP-Link', 'C0:25:E9': 'TP-Link',
  'C0:4A:00': 'TP-Link', 'C4:E9:84': 'TP-Link', 'CC:32:E5': 'TP-Link',
  'D4:6E:0E': 'TP-Link', 'D8:07:B6': 'TP-Link', 'D8:47:32': 'TP-Link',
  'E4:8D:8C': 'TP-Link', 'E8:48:B8': 'TP-Link', 'EC:08:6B': 'TP-Link',
  'EC:17:2F': 'TP-Link', 'F0:A7:31': 'TP-Link', 'F4:EC:38': 'TP-Link',
  'F4:F2:6D': 'TP-Link', 'F8:D1:11': 'TP-Link',

  // Raspberry Pi Foundation
  '28:CD:C1': 'Raspberry Pi', 'B8:27:EB': 'Raspberry Pi', 'D8:3A:DD': 'Raspberry Pi',
  'DC:A6:32': 'Raspberry Pi', 'E4:5F:01': 'Raspberry Pi',

  // Microsoft
  '00:03:FF': 'Microsoft', '00:0D:3A': 'Microsoft', '00:12:5A': 'Microsoft',
  '00:15:5D': 'Microsoft', '00:17:FA': 'Microsoft', '00:1D:D8': 'Microsoft',
  '00:22:48': 'Microsoft', '00:25:AE': 'Microsoft', '00:50:F2': 'Microsoft',
  '28:18:78': 'Microsoft', '30:59:B7': 'Microsoft', '38:F2:3E': 'Microsoft',
  '3C:83:75': 'Microsoft', '44:03:2C': 'Microsoft', '48:50:73': 'Microsoft',
  '50:1A:C5': 'Microsoft', '58:82:A8': 'Microsoft', '5C:B6:CC': 'Microsoft',
  '60:45:BD': 'Microsoft', '7C:1E:52': 'Microsoft', '7C:ED:8D': 'Microsoft',
  '94:9A:A9': 'Microsoft', '98:5F:D3': 'Microsoft', 'B4:0E:DE': 'Microsoft',
  'C8:3F:26': 'Microsoft', 'D4:81:D7': 'Microsoft', 'DC:B4:C4': 'Microsoft',

  // Intel
  '00:02:B3': 'Intel', '00:03:47': 'Intel', '00:04:23': 'Intel', '00:07:E9': 'Intel',
  '00:0C:F1': 'Intel', '00:0E:0C': 'Intel', '00:0E:35': 'Intel', '00:11:11': 'Intel',
  '00:12:F0': 'Intel', '00:13:02': 'Intel', '00:13:20': 'Intel', '00:13:CE': 'Intel',
  '00:13:E8': 'Intel', '00:15:00': 'Intel', '00:15:17': 'Intel', '00:16:6F': 'Intel',
  '00:16:76': 'Intel', '00:16:EA': 'Intel', '00:16:EB': 'Intel', '00:18:DE': 'Intel',
  '00:19:D1': 'Intel', '00:19:D2': 'Intel', '00:1B:21': 'Intel', '00:1B:77': 'Intel',
  '00:1C:BF': 'Intel', '00:1C:C0': 'Intel', '00:1D:E0': 'Intel', '00:1D:E1': 'Intel',
  '00:1E:64': 'Intel', '00:1E:65': 'Intel', '00:1F:3B': 'Intel', '00:1F:3C': 'Intel',
  '00:20:7B': 'Intel', '00:21:5C': 'Intel', '00:21:5D': 'Intel', '00:21:6A': 'Intel',
  '00:22:FA': 'Intel', '00:22:FB': 'Intel', '00:23:14': 'Intel', '00:23:15': 'Intel',
  '00:24:D6': 'Intel', '00:24:D7': 'Intel', '00:27:10': 'Intel',

  // HP (Hewlett-Packard)
  '00:01:E6': 'HP', '00:02:A5': 'HP', '00:04:EA': 'HP', '00:08:02': 'HP',
  '00:08:83': 'HP', '00:0B:CD': 'HP', '00:0D:9D': 'HP', '00:0E:7F': 'HP',
  '00:0F:20': 'HP', '00:0F:61': 'HP', '00:10:83': 'HP', '00:11:0A': 'HP',
  '00:11:85': 'HP', '00:12:79': 'HP', '00:13:21': 'HP', '00:14:38': 'HP',
  '00:14:C2': 'HP', '00:15:60': 'HP', '00:16:35': 'HP', '00:17:08': 'HP',
  '00:17:A4': 'HP', '00:18:71': 'HP', '00:18:FE': 'HP', '00:19:BB': 'HP',
  '00:1A:4B': 'HP', '00:1B:78': 'HP', '00:1C:2E': 'HP', '00:1E:0B': 'HP',
  '00:1F:29': 'HP', '00:1F:FE': 'HP', '00:21:5A': 'HP', '00:22:64': 'HP',
  '00:23:7D': 'HP', '00:24:81': 'HP', '00:25:B3': 'HP', '00:26:55': 'HP',
  '00:30:6E': 'HP', '00:30:C1': 'HP', '00:60:B0': 'HP', '08:00:09': 'HP',
  '0C:C4:7A': 'HP', '10:00:5A': 'HP', '10:1F:74': 'HP', '10:60:4B': 'HP',
  '14:02:EC': 'HP', '14:58:D0': 'HP', '18:A9:05': 'HP', '1C:C1:DE': 'HP',
  '1C:98:EC': 'HP', '20:67:7C': 'HP', '24:BE:05': 'HP', '28:80:23': 'HP',

  // Netgear
  '00:09:5B': 'Netgear', '00:0F:B5': 'Netgear', '00:14:6C': 'Netgear',
  '00:1B:2F': 'Netgear', '00:1E:2A': 'Netgear', '00:1F:33': 'Netgear',
  '00:22:3F': 'Netgear', '00:24:B2': 'Netgear', '00:26:F2': 'Netgear',
  '08:BD:43': 'Netgear', '10:0C:6B': 'Netgear', '10:0D:7F': 'Netgear',
  '1C:B7:2C': 'Netgear', '20:0C:C8': 'Netgear', '28:C6:8E': 'Netgear',
  '2C:30:33': 'Netgear', '2C:B0:5D': 'Netgear', '30:46:9A': 'Netgear',
  '38:94:ED': 'Netgear', '3C:37:86': 'Netgear', '44:94:FC': 'Netgear',
  '4C:60:DE': 'Netgear', '6C:B0:CE': 'Netgear', '84:1B:5E': 'Netgear',
  '8C:3B:AD': 'Netgear', '94:04:9C': 'Netgear', '9C:3D:CF': 'Netgear',
  'A0:04:60': 'Netgear', 'A0:21:B7': 'Netgear', 'A0:40:A0': 'Netgear',
  'A4:2B:8C': 'Netgear', 'B0:7F:B9': 'Netgear', 'B0:B9:8A': 'Netgear',
  'C4:04:15': 'Netgear', 'C4:3D:C7': 'Netgear', 'CC:40:D0': 'Netgear',
  'DC:EF:09': 'Netgear', 'E0:46:9A': 'Netgear', 'E0:91:F5': 'Netgear',
  'E4:F4:C6': 'Netgear', 'E8:FC:AF': 'Netgear', 'F8:73:94': 'Netgear',

  // ASUS
  '00:0C:6E': 'ASUS', '00:0E:A6': 'ASUS', '00:11:2F': 'ASUS', '00:11:D8': 'ASUS',
  '00:13:D4': 'ASUS', '00:15:F2': 'ASUS', '00:17:31': 'ASUS', '00:18:F3': 'ASUS',
  '00:1A:92': 'ASUS', '00:1B:FC': 'ASUS', '00:1D:60': 'ASUS', '00:1E:8C': 'ASUS',
  '00:1F:C6': 'ASUS', '00:22:15': 'ASUS', '00:23:54': 'ASUS', '00:24:8C': 'ASUS',
  '00:25:22': 'ASUS', '00:26:18': 'ASUS', '04:D9:F5': 'ASUS', '08:60:6E': 'ASUS',
  '0C:9D:92': 'ASUS', '10:7B:44': 'ASUS', '14:DA:E9': 'ASUS', '1C:87:2C': 'ASUS',
  '20:CF:30': 'ASUS', '24:4B:FE': 'ASUS', '2C:4D:54': 'ASUS', '2C:56:DC': 'ASUS',
  '30:5A:3A': 'ASUS', '30:85:A9': 'ASUS', '34:97:F6': 'ASUS', '38:2C:4A': 'ASUS',
  '38:D5:47': 'ASUS', '3C:97:0E': 'ASUS', '40:16:7E': 'ASUS', '40:B0:76': 'ASUS',
  '48:5B:39': 'ASUS', '4C:ED:FB': 'ASUS', '50:46:5D': 'ASUS', '54:04:A6': 'ASUS',

  // Linksys (Belkin)
  '00:04:5A': 'Linksys', '00:06:25': 'Linksys', '00:0C:41': 'Linksys',
  '00:0F:66': 'Linksys', '00:12:17': 'Linksys', '00:14:BF': 'Linksys',
  '00:16:B6': 'Linksys', '00:18:39': 'Linksys', '00:18:F8': 'Linksys',
  '00:1A:70': 'Linksys', '00:1C:10': 'Linksys', '00:1D:7E': 'Linksys',
  '00:1E:E5': 'Linksys', '00:21:29': 'Linksys', '00:22:6B': 'Linksys',
  '00:23:69': 'Linksys', '00:25:9C': 'Linksys',

  // D-Link
  '00:05:5D': 'D-Link', '00:0D:88': 'D-Link', '00:0F:3D': 'D-Link',
  '00:11:95': 'D-Link', '00:13:46': 'D-Link', '00:15:E9': 'D-Link',
  '00:17:9A': 'D-Link', '00:19:5B': 'D-Link', '00:1B:11': 'D-Link',
  '00:1C:F0': 'D-Link', '00:1E:58': 'D-Link', '00:1F:0D': 'D-Link',
  '00:21:91': 'D-Link', '00:22:B0': 'D-Link', '00:24:01': 'D-Link',
  '00:26:5A': 'D-Link', '14:D6:4D': 'D-Link', '1C:7E:E5': 'D-Link',
  '28:10:7B': 'D-Link', '34:08:04': 'D-Link', '3C:1E:04': 'D-Link',
  '78:54:2E': 'D-Link', '90:94:E4': 'D-Link', 'B8:A3:86': 'D-Link',
  'BC:F6:85': 'D-Link', 'C0:A0:BB': 'D-Link', 'C8:BE:19': 'D-Link',
  'CC:B2:55': 'D-Link', 'F0:7D:68': 'D-Link', 'FC:75:16': 'D-Link',

  // Ubiquiti
  '00:15:6D': 'Ubiquiti', '00:27:22': 'Ubiquiti', '04:18:D6': 'Ubiquiti',
  '18:E8:29': 'Ubiquiti', '24:5A:4C': 'Ubiquiti', '24:A4:3C': 'Ubiquiti',
  '44:D9:E7': 'Ubiquiti', '68:72:51': 'Ubiquiti', '70:A7:41': 'Ubiquiti',
  '74:83:C2': 'Ubiquiti', '74:AC:B9': 'Ubiquiti', '78:8A:20': 'Ubiquiti',
  '80:2A:A8': 'Ubiquiti', '9C:05:D6': 'Ubiquiti', 'AC:8B:A9': 'Ubiquiti',
  'B4:FB:E4': 'Ubiquiti', 'D0:21:F9': 'Ubiquiti', 'DC:9F:DB': 'Ubiquiti',
  'E0:63:DA': 'Ubiquiti', 'F0:9F:C2': 'Ubiquiti', 'F4:92:BF': 'Ubiquiti',
  'FC:EC:DA': 'Ubiquiti',

  // Xiaomi
  '00:9E:C8': 'Xiaomi', '04:CF:8C': 'Xiaomi', '0C:1D:AF': 'Xiaomi',
  '10:2A:B3': 'Xiaomi', '14:F6:5A': 'Xiaomi', '18:59:36': 'Xiaomi',
  '20:82:C0': 'Xiaomi', '28:6C:07': 'Xiaomi', '34:80:B3': 'Xiaomi',
  '38:A4:ED': 'Xiaomi', '3C:BD:3E': 'Xiaomi', '40:31:3C': 'Xiaomi',
  '44:23:7C': 'Xiaomi', '50:64:2B': 'Xiaomi', '58:44:98': 'Xiaomi',
  '5C:B1:3E': 'Xiaomi', '64:09:80': 'Xiaomi', '64:B4:73': 'Xiaomi',
  '68:AB:1E': 'Xiaomi', '74:23:44': 'Xiaomi', '78:02:F8': 'Xiaomi',
  '78:11:DC': 'Xiaomi', '7C:1D:D9': 'Xiaomi',
  '8C:BE:BE': 'Xiaomi', '98:FA:E3': 'Xiaomi', '9C:99:A0': 'Xiaomi',
  'A4:08:EA': 'Xiaomi', 'AC:C1:EE': 'Xiaomi', 'B0:E2:35': 'Xiaomi',
  'C4:0B:CB': 'Xiaomi', 'D4:3B:04': 'Xiaomi', 'E4:46:DA': 'Xiaomi',
  'F0:B4:29': 'Xiaomi', 'F4:F5:DB': 'Xiaomi', 'F8:A4:5F': 'Xiaomi',
  'FC:64:BA': 'Xiaomi',

  // Nest (Google)
  '18:B4:30': 'Nest', '64:16:66': 'Nest',

  // Ring (Amazon)
  '34:3E:A4': 'Ring', '50:01:BB': 'Ring', '90:48:9A': 'Ring', 'DC:A6:1F': 'Ring',

  // Wyze
  '2C:AA:8E': 'Wyze', '7C:78:B2': 'Wyze',

  // Bose
  '04:52:C7': 'Bose', '08:DF:1F': 'Bose', '28:11:A5': 'Bose', '4C:87:5D': 'Bose',
  '88:C6:26': 'Bose', 'D4:2C:3F': 'Bose',

  // Harman (JBL, Harman Kardon)
  '00:09:A7': 'Harman', '6C:C2:6B': 'Harman', '70:50:AF': 'Harman',

  // Epson
  '00:00:48': 'Epson', '00:1B:52': 'Epson', '00:26:AB': 'Epson', '04:54:19': 'Epson',
  '20:C3:8F': 'Epson', '44:D2:44': 'Epson', '64:EB:8C': 'Epson', '98:48:27': 'Epson',
  'AC:18:26': 'Epson', 'C4:36:55': 'Epson', 'E8:25:04': 'Epson',

  // Brother
  '00:1B:A9': 'Brother', '00:80:77': 'Brother', '30:05:5C': 'Brother',
  '38:81:D7': 'Brother',

  // Canon
  '00:00:85': 'Canon', '00:1E:8F': 'Canon', '18:0C:AC': 'Canon', '1C:BD:B9': 'Canon',
  '30:52:CB': 'Canon', '3C:A0:67': 'Canon', '64:1C:67': 'Canon', '8C:45:00': 'Canon',
  'A0:6D:09': 'Canon', 'B8:AC:6F': 'Canon', 'F4:81:39': 'Canon', 'F8:0D:60': 'Canon',

  // Hikvision
  '00:0C:29': 'Hikvision', '28:57:BE': 'Hikvision', '44:47:CC': 'Hikvision',
  '4C:BD:8F': 'Hikvision', '54:C4:15': 'Hikvision', '5C:E3:B6': 'Hikvision',
  '7C:3B:B0': 'Hikvision', '80:A5:7E': 'Hikvision', '8C:E7:48': 'Hikvision',
  'A4:50:46': 'Hikvision', 'BC:AD:28': 'Hikvision', 'C0:56:E3': 'Hikvision',
  'E0:CA:4D': 'Hikvision',

  // Dahua
  '3C:EF:8C': 'Dahua', '4C:11:BF': 'Dahua', '90:02:A9': 'Dahua',
  'A0:BD:1D': 'Dahua', 'B0:A7:32': 'Dahua', 'E0:50:8B': 'Dahua',

  // Axis Communications (IP cameras)
  '00:40:8C': 'Axis Communications', 'AC:CC:8E': 'Axis Communications',
  'B8:A4:4F': 'Axis Communications',

  // Tuya
  '10:D5:61': 'Tuya', '50:8A:06': 'Tuya', '7C:F6:66': 'Tuya',
  'D4:A6:51': 'Tuya', 'D8:1F:12': 'Tuya',

  // Ikea (Tradfri)
  '00:0B:57': 'IKEA', 'CC:1B:E0': 'IKEA',

  // Wemo (Belkin)
  '08:86:3B': 'Belkin', '30:23:03': 'Belkin', '94:10:3E': 'Belkin',
  'B4:75:0E': 'Belkin', 'C0:56:27': 'Belkin', 'E8:9F:80': 'Belkin',
  'EC:1A:59': 'Belkin',

  // Dell
  '00:06:5B': 'Dell', '00:08:74': 'Dell', '00:0B:DB': 'Dell', '00:0D:56': 'Dell',
  '00:0F:1F': 'Dell', '00:11:43': 'Dell', '00:12:3F': 'Dell', '00:13:72': 'Dell',
  '00:14:22': 'Dell', '00:15:C5': 'Dell', '00:16:F0': 'Dell', '00:18:8B': 'Dell',
  '00:19:B9': 'Dell', '00:1A:A0': 'Dell', '00:1C:23': 'Dell', '00:1D:09': 'Dell',
  '00:1E:4F': 'Dell', '00:21:70': 'Dell', '00:21:9B': 'Dell',
  '00:22:19': 'Dell', '00:23:AE': 'Dell', '00:24:E8': 'Dell', '00:25:64': 'Dell',
  '00:26:B9': 'Dell', '14:FE:B5': 'Dell', '18:03:73': 'Dell', '18:A9:9B': 'Dell',
  '18:DB:F2': 'Dell', '18:FB:7B': 'Dell', '1C:40:24': 'Dell', '20:47:47': 'Dell',
  '24:6E:96': 'Dell', '24:B6:FD': 'Dell', '28:F1:0E': 'Dell', '34:17:EB': 'Dell',

  // Lenovo
  '00:06:1B': 'Lenovo', '00:09:2D': 'Lenovo', '00:0A:E4': 'Lenovo',
  '00:12:FE': 'Lenovo', '00:1A:6B': 'Lenovo', '00:21:CC': 'Lenovo',
  '00:24:7E': 'Lenovo', '00:26:2D': 'Lenovo', '08:D4:0C': 'Lenovo',
  '14:5A:FC': 'Lenovo', '28:D2:44': 'Lenovo', '34:02:86': 'Lenovo',
  '40:B0:34': 'Lenovo', '44:8A:5B': 'Lenovo', '50:7B:9D': 'Lenovo',
  '54:E1:AD': 'Lenovo', '5C:B9:01': 'Lenovo', '6C:C2:17': 'Lenovo',
  '70:5A:0F': 'Lenovo', '74:E5:0B': 'Lenovo', '78:E7:D1': 'Lenovo',
  '8C:16:45': 'Lenovo', '98:54:1B': 'Lenovo', 'A4:34:D9': 'Lenovo',
  'B8:6B:23': 'Lenovo', 'C8:5B:76': 'Lenovo', 'D0:BF:9C': 'Lenovo',
  'E8:2A:44': 'Lenovo', 'F0:03:8C': 'Lenovo',

  // Huawei
  '00:18:82': 'Huawei', '00:1E:10': 'Huawei', '00:22:A1': 'Huawei',
  '00:25:9E': 'Huawei', '00:25:68': 'Huawei', '00:46:4B': 'Huawei',
  '00:66:4B': 'Huawei', '00:E0:FC': 'Huawei', '04:C0:6F': 'Huawei',
  '04:F9:38': 'Huawei', '08:19:A6': 'Huawei', '0C:37:DC': 'Huawei',
  '0C:45:BA': 'Huawei', '10:44:00': 'Huawei', '10:47:80': 'Huawei',
  '14:B9:68': 'Huawei', '18:D2:76': 'Huawei', '1C:1D:67': 'Huawei',
  '20:08:ED': 'Huawei', '20:0B:C7': 'Huawei', '20:A6:CD': 'Huawei',
  '20:F3:A3': 'Huawei', '24:09:95': 'Huawei', '24:1F:A0': 'Huawei',
  '28:31:52': 'Huawei', '28:3C:E4': 'Huawei', '28:6E:D4': 'Huawei',

  // Cisco
  '00:00:0C': 'Cisco', '00:01:42': 'Cisco', '00:01:43': 'Cisco', '00:01:63': 'Cisco',
  '00:01:64': 'Cisco', '00:01:96': 'Cisco', '00:01:97': 'Cisco', '00:01:C7': 'Cisco',
  '00:01:C9': 'Cisco', '00:02:16': 'Cisco', '00:02:17': 'Cisco', '00:02:3D': 'Cisco',
  '00:02:4A': 'Cisco', '00:02:4B': 'Cisco', '00:02:7D': 'Cisco', '00:02:7E': 'Cisco',
  '00:02:B9': 'Cisco', '00:02:BA': 'Cisco', '00:02:FC': 'Cisco', '00:02:FD': 'Cisco',

  // Aruba (HP Enterprise)
  '00:0B:86': 'Aruba Networks', '00:1A:1E': 'Aruba Networks',
  '00:24:6C': 'Aruba Networks', '04:BD:88': 'Aruba Networks',
  '18:64:72': 'Aruba Networks', '20:4C:03': 'Aruba Networks',
  '24:DE:C6': 'Aruba Networks', '40:E3:D6': 'Aruba Networks',
  '6C:F3:7F': 'Aruba Networks', '84:D4:7E': 'Aruba Networks',
  '94:B4:0F': 'Aruba Networks', 'AC:A3:1E': 'Aruba Networks',
  'D8:C7:C8': 'Aruba Networks',

  // Ruckus (CommScope)
  '00:22:7F': 'Ruckus', '28:AC:9E': 'Ruckus', '44:48:C1': 'Ruckus',
  '4C:E1:75': 'Ruckus', '74:91:1A': 'Ruckus', '84:18:26': 'Ruckus',
  '8C:0C:90': 'Ruckus', 'B4:79:C8': 'Ruckus', 'C0:8A:DE': 'Ruckus',
  'CC:5F:DA': 'Ruckus', 'EC:58:EA': 'Ruckus', 'F4:C7:14': 'Ruckus',

  // VIZIO
  '00:24:20': 'VIZIO', '08:74:02': 'VIZIO', '0C:F4:D5': 'VIZIO',
  'B4:79:A7': 'VIZIO', 'D8:E0:E1': 'VIZIO',

  // TCL
  '50:D3:7F': 'TCL', '54:B8:0A': 'TCL', '78:4B:87': 'TCL',
  'CC:B8:A8': 'TCL', 'D0:54:2D': 'TCL', 'F0:D7:AA': 'TCL',

  // Hisense
  '00:14:7A': 'Hisense', '08:3E:5D': 'Hisense', '78:19:F7': 'Hisense',
  'B0:0A:D5': 'Hisense', 'DC:D9:16': 'Hisense',

  // ecobee
  '44:61:32': 'ecobee',

  // Wink
  'B8:B7:F1': 'Wink',

  // SmartThings (Samsung)
  'D0:52:A8': 'SmartThings', '28:6D:97': 'SmartThings',

  // LifeSmart
  'A0:A3:B3': 'LifeSmart',

  // Shelly
  // Note: Shelly uses Espressif chips; these OUIs overlap with Espressif
};

function normalizeOuiPrefix(mac: string): string {
  const cleaned = mac.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (cleaned.length < 6) return '';
  const a = cleaned.slice(0, 2);
  const b = cleaned.slice(2, 4);
  const c = cleaned.slice(4, 6);
  return `${a}:${b}:${c}`;
}

export function lookupOui(mac: string): string | undefined {
  const prefix = normalizeOuiPrefix(mac);
  if (!prefix) return undefined;
  return OUI_TABLE[prefix];
}
