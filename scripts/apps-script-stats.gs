/**
 * Google Apps Script exporter for Thí Vua Lấy Tốt homepage stats.
  * Deploy as a Web App (Execute as: Me, Who has access: Anyone)
   * and run installWeeklyStatsTrigger() once to schedule Monday 07:00 syncs.
    */

    const STATS_CONFIG = {
          YOUTUBE_CHANNEL_ID: 'UCvNW1NAWWjblgrP6JQI4MbQ',
            YOUTUBE_HANDLE_URL: 'https://' + 'www.youtube.com' + '/@TungJohnPlayingChess',
              CHESSCOM_CLUB_SLUG: 'thi-vua-lay-tot-tungjohn-playing-chess',
                CHESSCOM_CLUB_API: 'https://' + 'api.chess.com' + '/pub/club/thi-vua-lay-tot-tungjohn-playing-chess',
                  GIST_API_URL: 'https://' + 'api.github.com' + '/gists/9c53a11fca709a656076bf6de7c118b0',
                    GIST_RAW_URL: 'https://' + 'gist.githubusercontent.com' + '/M-DinhHoangViet/9c53a11fca709a656076bf6de7c118b0/raw',
                      PROPERTY_KEY: 'TVLT_HOMEPAGE_STATS',
                        SHEET_NAME: 'Stats'
    };

    function doGet(e) {
          var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : 'stats';
            if (action !== 'stats') {
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
        var peRaw = fetchPrizeEventsCount_();

        var youtubeSubsRaw = (typeof ytRaw === 'number' && ytRaw > 0) ? ytRaw : (prev.youtube_subs_raw || null);
        var youtubeSubs = youtubeSubsRaw ? formatThousandsK_(youtubeSubsRaw) : (prev.youtube_subs || '17K+');

        var chesscomMembersRaw = (typeof ccRaw === 'number' && ccRaw > 0) ? ccRaw : (prev.chesscom_members_raw || null);
        var chesscomMembers = chesscomMembersRaw ? formatThousandsK_(chesscomMembersRaw) : (prev.chesscom_members || '5K+');

        var prizeEventsRaw = (typeof peRaw === 'number' && peRaw > 0) ? peRaw : (prev.prize_events_raw || null);
        var prizeEvents = prizeEventsRaw ? formatPrizeEvents_(prizeEventsRaw) : (prev.prize_events || '50+');

        var payload = {
            youtube_subs: youtubeSubs,
            youtube_subs_raw: youtubeSubsRaw,
            chesscom_members: chesscomMembers,
            chesscom_members_raw: chesscomMembersRaw,
            prize_events: prizeEvents,
            prize_events_raw: prizeEventsRaw,
            updated_at: new Date().toISOString(),
            source: 'google-apps-script'
        };

        props.setProperty(STATS_CONFIG.PROPERTY_KEY, JSON.stringify(payload));
        writeStatsToSheet_(payload);
        return payload;
    }

    function installWeeklyStatsTrigger() {
        var triggers = ScriptApp.getProjectTriggers();
        for (var i = 0; i < triggers.length; i++) {
            if (triggers[i].getHandlerFunction() === 'syncHomepageStats') {
                ScriptApp.deleteTrigger(triggers[i]);
            }
        }
        ScriptApp.newTrigger('syncHomepageStats')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.MONDAY)
        .atHour(7)
        .everyWeeks(1)
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
                headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (htmlRes.getResponseCode() !== 200) return null;
        var html = htmlRes.getContentText();
        var match = html.match(/"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/) || html.match(/"subscriberCountText"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
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

    function fetchPrizeEventsCount_() {
        try {
            var text = null;
            var apiRes = UrlFetchApp.fetch(STATS_CONFIG.GIST_API_URL, {
                muteHttpExceptions: true,
                headers: { 'User-Agent': 'GoogleAppsScript' }
        });
        if (apiRes.getResponseCode() === 200) {
            var gistJson = JSON.parse(apiRes.getContentText());
            if (gistJson && gistJson.files) {
                var fileKeys = Object.keys(gistJson.files);
                for (var i = 0; i < fileKeys.length; i++) {
                    var f = gistJson.files[fileKeys[i]];
                    if (f && f.content) {
                        text = f.content;
                        break;
                    }
                }
            }
        }
        if (!text) {
            var rawRes = UrlFetchApp.fetch(STATS_CONFIG.GIST_RAW_URL, { muteHttpExceptions: true });
            if (rawRes.getResponseCode() === 200) {
                text = rawRes.getContentText();
            }
        }
        if (!text) return null;
        var parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed.length;
        if (parsed && Array.isArray(parsed.tournaments)) return parsed.tournaments.length;
        if (parsed && Array.isArray(parsed.events)) return parsed.events.length;
        if (parsed && typeof parsed === 'object') return Object.keys(parsed).length;
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

     