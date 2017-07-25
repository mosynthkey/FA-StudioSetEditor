$(function() {
  // 初期化処理
  createUI();

  var midi = new Midi();
  // 使用可能になるまで待つ
  var wait_midi_timer = setInterval(function() {
    if (midi.available) {
      clearInterval(wait_midi_timer);

      fa = new FA(midi);
      FAParams.setFA(fa);

      // パラメーターの設定
      ssc = new FAParams('Studio Set Common', 0x18000000, 0x5d, 0, null, 0, null);
      ssc.connect(0x00, 0x0f, null, $('#ss_name'), FAParams.toInput, FAParams.fromInput);
      for (var i = 1; i <= 16; i++) ssc.connectButton(0x54, $('#c' + i + '_select'), i - 1);

      ssp = new Array(16);
      ssz = new Array(16);
      sspeq = new Array(16);
      tone_common = new Array(16);
      for (var i = 1; i <= 16; i++) {
        ssz[i - 1] = new FAParams('Studio Set Zone ' + i, 0x18004000, 0x23, i, function(ch){return ((ch - 1) * 0x0100);}, 0, null);
        ssz[i - 1].connectCheck(0x02, $('#c' + i + '_kbd'), 1);

        sspeq[i - 1] = new FAParams('Studio Set Part EQ ' + i, 0x18003000, 0x08, i, function(ch){return ((ch - 1) * 0x0100);}, 0, null);
        sspeq[i - 1].connectCheck(0x00, $('#c' + i + '_eqsw'), 1);
        sspeq[i - 1].connectSelect(0x01, $('#c' + i + '_eqlf'));
        sspeq[i - 1].connectSelect(0x02, $('#c' + i + '_eqlg'));
        sspeq[i - 1].connectSelect(0x03, $('#c' + i + '_eqmf'));
        sspeq[i - 1].connectSelect(0x04, $('#c' + i + '_eqmg'));
        sspeq[i - 1].connectSelect(0x05, $('#c' + i + '_eqmq'));
        sspeq[i - 1].connectSelect(0x06, $('#c' + i + '_eqhf'));
        sspeq[i - 1].connectSelect(0x07, $('#c' + i + '_eqhg'));

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

  $('.change_tone_name_button').each(function(i){
    $(this).on('click', function(){changeToneName(i+1)});
  });

  $('.count_tone_name_up_button').each(function(i){
    $(this).on('click', function(){countToneNameUp(i+1)});
  });

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

function recieveAll()
{
  FAParams.recieveAll();
}

function changeToneName(part)
{
  var tails = ['_pcm', '_sns', '_sna', '_pcmd', '_snd'];
  for (t in tails) {
    if ($('#c' + part + '_name' + tails[t]).is(':visible')) {
      result = getNewName($('#c' + part + '_name' + tails[t]).val());
      $('#c' + part + '_name' + tails[t]).val(result).change();
      break;
    }
  }
}

function countToneNameUp(part)
{
  var tails = ['_pcm', '_sns', '_sna', '_pcmd', '_snd'];
  for (t in tails) {
    if ($('#c' + part + '_name' + tails[t]).is(':visible')) {
      result = countNameUp($('#c' + part + '_name' + tails[t]).val());
      $('#c' + part + '_name' + tails[t]).val(result).change();
      break;
    }
  }
}

function getNewName(old_name)
{
  var len = old_name.length;
  console.log("len:" + len)
  var new_name = old_name;
  if (old_name[len-1] == "'") {
    new_name = new_name.slice(0, len-1).concat('"');
  } else if (len < 12) {
    new_name += "'";
  } else if (len >= 12) {
    // スペース削除
    new_name = shortenName(old_name);
    if (new_name.length < 12) {
      new_name += "'";
    }
  }

  return new_name;
}

function countNameUp(old_name)
{
  var new_name = old_name;
  new_name = new_name.replace(/[0-9]+$/, parseInt(new_name.match(/[0-9]+$/)) + 1);

  while (new_name.length > 12) {
    var new_name_ = shortenName(new_name);
    if (new_name_ == new_name) return old_name;
    new_name = new_name_;
  }
  return new_name;
}

function shortenName(old_name)
{
  var new_name = old_name;
  new_name = new_name.replace(/Lead/g,'Ld');
  if (new_name.length >= 12) new_name = new_name.replace(/Piano/g,'Pno');
  if (new_name.length >= 12) new_name = new_name.replace(/Organ/g,'Org');
  if (new_name.length >= 12) new_name = new_name.replace(/Strings/g,'Str');
  if (new_name.length >= 12) new_name = new_name.replace(/Choir/g,'Cho');
  if (new_name.length >= 12) new_name = new_name.replace(/Bell/g,'Bl');
  if (new_name.length >= 12) new_name = new_name.replace(/Brass/g,'Brs');
  if (new_name.length >= 12) new_name = new_name.replace(/Grand/g,'Gnd');
  if (new_name.length >= 12) new_name = new_name.replace(/ /g,'');
  if (new_name.length >= 12) {
    for (var i = new_name.length - 1; i >= 1; i--) {
      if (isSmallVowel(new_name[i])) {
        new_name = new_name.slice(0, i) + new_name.slice(i+1, new_name.length);
        break;
      }
    }
  }

  return new_name;
}

function isSmallVowel(c)
{
  return /[aeiou]/.test(c);
}
