/**  Deploy as a Web App (Execute as: Me, Who has access: Anyone)
   * and run installEvery3DaysStatsTrigger() once to schedule every-3-days 07:00 syncs and serve JSON directly via Web App doGet(e).
    */

    const STATS_CONFIG = {
          YOUTUBE_CHANNEL_ID: 'UCvNW1NAWWjblgrP6JQI4MbQ',
            YOUTUBE_HANDLE_URL: 'https://' + 'www.youtube.com' + '/@TungJohnPlayingChess',
              CHESSCOM_CLUB_SLUG: 'thi-vua-lay-tot-tungjohn-playing-chess',
                CHESSCOM_CLUB_API: 'https://' + 'api.chess.com' + '/pub/club/thi-vua-lay-tot-tungjohn-playing-chess',
        TOURNAMENTS_GIST_ID: '9c53a11fca709a656076bf6de7c118b0',
    TOURNAMENTS_GIST_RAW_BASE: 'https://gist.githubusercontent.com/M-DinhHoangViet/9c53a11fca709a656076bf6de7c118b0/raw',
              PROPERTY_KEY: 'TVLT_HOMEPAGE_STATS',
                        SHEET_NAME: 'Stats'
    };

    function doGet(e) {
          var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : 'stats';
        if (action && action !== 'stats') {
                return ContentService
                          .createTextOutput(JSON.stringify({ error: 'Unsupported action', action: action }))
                                .setMimeType(ContentService.MimeType.JSON);
            }

              var props = PropertiesService.getScriptProperties();
                var raw = props.getProperty(STATS_CONFIG.PROPERTY_KEY);
                  var data;
                    if (raw) {
                            try {
                                      data = JSON.parse(raw);
                            } catch (err) {
                                      data = null;
                            }
                    }
                      if (!data) {
                            data = syncHomepageStats();
                      }

                        return ContentService
                            .createTextOutput(JSON.stringify(data))
                                .setMimeType(ContentService.MimeType.JSON);
    }

    function syncHomepageStats() {
        var props = PropertiesService.getScriptProperties();
        var prev = {};
        try {
            var prevRaw = props.getProperty(STATS_CONFIG.PROPERTY_KEY);
            if (prevRaw) prev = JSON.parse(prevRaw) || {};
        } catch (err) {
            prev = {};
        }

        var ytRaw = fetchYoutubeSubscribers_();
        var ccRaw = fetchChesscomMembers_();
    var peResult = fetchPrizeEventsFromGist_();
    var peRaw = (peResult && typeof peResult.total === 'number') ? peResult.total : null;

        var youtubeSubsRaw = (typeof ytRaw === 'number' && ytRaw > 0) ? ytRaw : (prev.youtube_subs_raw || null);
        var youtubeSubs = youtubeSubsRaw ? formatThousandsK_(youtubeSubsRaw) : (prev.youtube_subs || '174K+');

        var chesscomMembersRaw = (typeof ccRaw === 'number' && ccRaw > 0) ? ccRaw : (prev.chesscom_members_raw || null);
        var chesscomMembers = chesscomMembersRaw ? formatThousandsK_(chesscomMembersRaw) : (prev.chesscom_members || '22K+');

        var prizeEventsBreakdown = (peResult && peResult.breakdown) ? peResult.breakdown : (prev.prize_events_breakdown || null);
    var prizeEventsRaw = (typeof peRaw === 'number' && peRaw > 0) ? peRaw : (prev.prize_events_raw || null);
        var prizeEvents = prizeEventsRaw ? formatPrizeEvents_(prizeEventsRaw) : (prev.prize_events || '110+');

        var payload = {
            youtube_subs: youtubeSubs,
            youtube_subs_raw: youtubeSubsRaw,
            chesscom_members: chesscomMembers,
            chesscom_members_raw: chesscomMembersRaw,
            prize_events: prizeEvents,
            prize_events_raw: prizeEventsRaw,
            prize_events_breakdown: prizeEventsBreakdown,
        updated_at: new Date().toISOString(),
            sync_interval_days: 3,
        source: 'google-apps-script'
        };

        props.setProperty(STATS_CONFIG.PROPERTY_KEY, JSON.stringify(payload));
        writeStatsToSheet_(payload);
    return payload;
    }

    function installEvery3DaysStatsTrigger() {
    var triggers = ScriptApp.getProjectTriggers();
        for (var i = 0; i < triggers.length; i++) {
            if (triggers[i].getHandlerFunction() === 'syncHomepageStats') {
                ScriptApp.deleteTrigger(triggers[i]);
            }
        }
        ScriptApp.newTrigger('syncHomepageStats')
        .timeBased()
            .everyDays(3)
    .atHour(7)
        .create();
    }

    function fetchYoutubeSubscribers_() {
        try {
            var apiKey = PropertiesService.getScriptProperties().getProperty('YOUTUBE_API_KEY');
            if (apiKey) {
                var apiUrl = 'https://' + 'www.googleapis.com' + '/youtube/v3/channels?part=statistics&id=' + encodeURIComponent(STATS_CONFIG.YOUTUBE_CHANNEL_ID) + '&key=' + encodeURIComponent(apiKey);
                var apiRes = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });
                if (apiRes.getResponseCode() === 200) {
                    var apiJson = JSON.parse(apiRes.getContentText());
                    var count = apiJson && apiJson.items && apiJson.items[0] && apiJson.items[0].statistics && apiJson.items[0].statistics.subscriberCount;
                    if (count) {
                        var parsedApi = Number(count);
                        if (!isNaN(parsedApi) && parsedApi > 0) return parsedApi;
                    }
                }
            }
        } catch (err) {}

        try {
            var htmlRes = UrlFetchApp.fetch(STATS_CONFIG.YOUTUBE_HANDLE_URL, {
                muteHttpExceptions: true,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9', 'Cookie': 'CONSENT=YES+cb; SOCS=CAI' }
        });
        if (htmlRes.getResponseCode() !== 200) return null;
        var html = htmlRes.getContentText();
        var match = html.match(/"content"\s*:\s*"([\d.,]+\s*[KMBkmb]?)\s+subscribers"/i) || html.match(/"accessibilityText"\s*:\s*"([\d.,]+\s*[KMBkmb]?)\s+subscribers"/i) || html.match(/"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/) || html.match(/"subscriberCountText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/) || html.match(/([\d.,]+\s*(?:K|M|N|Tr|nghìn|triệu)?)\s*(?:subscribers|người đăng ký)/i);
        if (match && match[1]) {
            return parseCompactNumber_(match[1]);
        }
    } catch (err) {}
        return null;
    }

    function fetchChesscomMembers_() {
        try {
            var res = UrlFetchApp.fetch(STATS_CONFIG.CHESSCOM_CLUB_API, { muteHttpExceptions: true });
            if (res.getResponseCode() !== 200) return null;
            var data = JSON.parse(res.getContentText());
            if (data && typeof data.members_count === 'number' && data.members_count > 0) {
                return data.members_count;
            }
        } catch (err) {}
        return null;
    }

  function fetchRawGistText_(fileName) {
    try {
        var url = STATS_CONFIG.TOURNAMENTS_GIST_RAW_BASE + '/' + encodeURIComponent(fileName) + '?t=' + Date.now();
        var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { 'User-Agent': 'GoogleAppsScript' } });
        if (res.getResponseCode() === 200) return res.getContentText() || '';
    } catch (err) {}
    return '';
}

function fetchPrizeEventsFromGist_() {
    try {
        var getNonEmptyLines = function (fileName) {
            var text = fetchRawGistText_(fileName);
            if (!text) return [];
            return String(text)
                .split(/\r?\n/)
                .map(function (line) { return line.trim(); })
                .filter(function (line) { return line.length > 0; });
        };

        var tvlt = getNonEmptyLines('tvlt.txt').length;
        var cbtt = getNonEmptyLines('cbtt.txt').length;
        var cttqLines = getNonEmptyLines('cttq.txt');
        if (cttqLines.length === 0) cttqLines = getNonEmptyLines('cttq');
        var cttqStarLines = cttqLines.filter(function (line) { return line.charAt(0) === '*'; });
        var cttqMonthly = cttqStarLines.length > 0 ? cttqStarLines.length : cttqLines.length;

        var total = tvlt + cttqMonthly + cbtt;
        if (total <= 0) return null;

        return {
            total: total,
            breakdown: {
                tvlt: tvlt,
                cttq_monthly: cttqMonthly,
                cbtt: cbtt
            }
        };
    } catch (err) {}
    return null;
}

    function parseCompactNumber_(str) {
        if (!str) return null;
        var clean = String(str).replace(/,/g, '.').trim();
        var m = clean.match(/([\d.]+)\s*([kKmMnN]|Tr|tr)?/);
        if (!m) return null;
        var val = parseFloat(m[1]);
        if (isNaN(val)) return null;
        var suffix = (m[2] || '').toLowerCase();
        if (suffix === 'k' || suffix === 'n') val *= 1000;
        else if (suffix === 'm' || suffix === 'tr') val *= 1000000;
        return Math.round(val);
    }

    function formatThousandsK_(num) {
        if (typeof num !== 'number' || isNaN(num) || num <= 0) return '';
        return num >= 1000 ? Math.floor(num / 1000) + 'K+' : String(num);
    }

    function formatPrizeEvents_(num) {
        if (typeof num !== 'number' || isNaN(num) || num <= 0) return '';
        return num >= 10 ? Math.floor(num / 10) * 10 + '+' : String(num);
    }

    function writeStatsToSheet_(payload) {
        try {
            var ss = SpreadsheetApp.getActiveSpreadsheet();
            if (!ss) return;
            var sheet = ss.getSheetByName(STATS_CONFIG.SHEET_NAME) || ss.insertSheet(STATS_CONFIG.SHEET_NAME);
            sheet.clearContents();
            sheet.getRange(1, 1, 4, 4).setValues([
                ['Metric', 'Display', 'Raw', 'Updated At'],
                ['YouTube Subscribers', payload.youtube_subs, payload.youtube_subs_raw || '', payload.updated_at],
                ['Chess.com Members', payload.chesscom_members, payload.chesscom_members_raw || '', payload.updated_at],
                ['Prize Events', payload.prize_events, payload.prize_events_raw || '', payload.updated_at]
            ]);
        } catch (err) {}
    }
