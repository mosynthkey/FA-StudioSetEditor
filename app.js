$(function() {
  // 初期化処理
  createUI();

  var midi = new Midi();
  // 使用可能になるまで待つ
  var wait_midi_timer = setInterval(function() {
    if (midi.available) {
      clearInterval(wait_midi_timer);

      fa = new FA(midi, reflectChangesFromFA);
      FAParams.setFA(fa);

      // パラメーターの設定
      ssc = new FAParams('Studio Set Common', 0x18000000, 0x5d, 0, null, 0, null);
      ssc.connect(0x00, 0x0f, null, $('#ss_name'), FAParams.toInput, FAParams.fromInput);
      for (var i = 1; i <= 16; i++) {
        ssc.connectButton(0x54, $('#c' + i + '_select'), i - 1)
      }

      ssp = new Array(16);
      ssz = new Array(16);
      tone_common = new Array(16);
      for (var i = 1; i <= 16; i++) {
        ssz[i - 1] = new FAParams('Studio Set Zone ' + i, 0x18004000, 0x23, i, function(ch){return ((ch - 1) * 0x0100);}, 0, null);
        ssz[i - 1].connectCheck(0x02, $('#c' + i + '_kbd'), 1);

        ssp[i - 1] = new FAParams('Studio Set Part ' + i, 0x18002000, 0x4c, i, function(ch){return ((ch - 1) * 0x0100);}, 0, null);
        ssp[i - 1].connectSelect(0x00, $('#c' + i + '_ch'));
        ssp[i - 1].connectSelect(0x1B, $('#c' + i + '_oct'));
        ssp[i - 1].connectCheck(0x3f, $('#c' + i + '_pb'), 1);
        ssp[i - 1].connectCheck(0x42, $('#c' + i + '_mod'), 1);
        ssp[i - 1].connectCheck(0x46, $('#c' + i + '_hld1'), 1);
        ssp[i - 1].connect(0x06, 0x02, null, null, function(d) {
          var addr = d['start_addr'];
          var ch = d['parent'].channel;
          var type = FA.getToneType(d['parent'].data[addr], d['parent'].data[addr + 1]);
          var name_ = {'PCMS': 'pcm', 'SN-S': 'sns', 'SN-A': 'sna', 'SN-D': 'snd', 'PCMD': 'pcmd'}[type[1]];
          ['pcm', 'sns', 'sna', 'snd', 'pcmd'].forEach(function(name) {
            if (name_ == name) {
              $('#c' + ch + '_name_' + name).show();
            } else {
              $('#c' + ch + '_name_' + name).hide();
            }
          });
          $('#c' + ch + '_type').html(type[0] + '<br>' + type[1]);
        }, function(d){});

        tone_common[i - 1] = new Object();
        tone_common[i - 1]['pcm'] = new FAParams('PCM Synth Tone Common ' + i, 0x19000000, 0x50, i, FAParams.temporaryToneChOffset, 0, null);
        tone_common[i - 1]['pcm'].connectInput(0x00, 0x0c, $('#c' + i + '_name_pcm'));
        tone_common[i - 1]['sns'] = new FAParams('SN Synth Tone Common ' + i, 0x19010000, 0x50, i, FAParams.temporaryToneChOffset, 0, null);
        tone_common[i - 1]['sns'].connectInput(0x00, 0x0c, $('#c' + i + '_name_sns'));
        tone_common[i - 1]['sna'] = new FAParams('SN Acoustic Tone Common ' + i, 0x19020000, 0x50, i, FAParams.temporaryToneChOffset, 0, null);
        tone_common[i - 1]['sna'].connectInput(0x00, 0x0c, $('#c' + i + '_name_sna'));
        tone_common[i - 1]['snd'] = new FAParams('SN Drum Common ' + i, 0x19030000, 0x50, i, FAParams.temporaryToneChOffset, 0, null);
        tone_common[i - 1]['snd'].connectInput(0x00, 0x0c, $('#c' + i + '_name_snd'));
        tone_common[i - 1]['pcmd'] = new FAParams('PCM Drum Tone Common ' + i, 0x19100000, 0x50, i, FAParams.temporaryToneChOffset, 0, null);
        tone_common[i - 1]['pcmd'].connectInput(0x00, 0x0c, $('#c' + i + '_name_pcmd'));
      }

      var wait_fa_timer = setInterval(function() {
        if (fa.available) {
          clearInterval(wait_fa_timer);
          FAParams.recieveAll();
        }
        if (fa.notFound) {
          $('#FaNotFoundDialog').dialog('open');
          FAParams.recieveAll();
        }
      }, 500);
    }
  }, 500);
});

function createUI()
{
  $("#tabs").tabs();
  $(".tone_names>input").each(function(i) {
    if (i % 5 != 0) $(this).hide();
    $(this).css('width', '160px');
  });
  $('input').each(function(){
    if ($(this).prop("type") == 'checkbox') {
      $(this).button();
    }
  });
  $('button').button();

  $('.part_select').each(function(){
    $(this).css('width', '70px');
  });

//  $('select').selectmenu();

   $("#FaNotFoundDialog").dialog({autoOpen: false});
}

function refreshUI()
{
  $('input').each(function(){
    if ($(this).prop("type") == 'checkbox') {
      $(this).button('refresh');
    }
  });
}

function reflectChangesFromFA()
{
  // FAの変更をコントロールに反映する
  console.log(this);
}

function applyChangesToFA(obj)
{
  // コントロールからの変更をFAに反映する
  console.log(obj);
}

function recieveAll()
{
  FAParams.recieveAll();
}
