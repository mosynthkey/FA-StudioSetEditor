function FAParams(name, b_addr, total_size, ch, ch_ofst_f, pt, pt_ofst_f)
{
  this.name = name;
  this.b_addr = b_addr;

  if (ch_ofst_f == null) ch_ofst_f = FAParams.nullOffset;
  if (pt_ofst_f == null) pt_ofst_f = FAParams.nullOffset;

  this.channel = ch;
  this.channel_offset = ch_ofst_f(ch);
  this.partial = pt;
  this.partial_offset = pt_ofst_f(pt);
  this.data = [];
  this.ctrls = [];
  this.total_size = total_size;
  this.addr = b_addr + this.channel_offset + this.partial_offset;

  FAParams.allParams.push(this);
}

FAParams.fa = null;
FAParams.allParams = [];

FAParams.setFA = function(fa)
{
  FAParams.fa = fa;
};

FAParams.setData = function(addr_ary, data_ary)
{
  var addr = addr_ary.from4Arrayto32Int();
  FAParams.allParams.forEach(function(p) {
    if (p.addr == addr) {
      p.data = data_ary.concat();
      p.ctrls.forEach(function(obj) {
        if (obj['sendToCtrl'] != null) obj['sendToCtrl'](obj);
      });
    }
  });
}

FAParams.temporaryToneChOffset = function(ch)
{
  return [((ch - 1) >> 2), ((((ch - 1) & 0x03) * 2) << 0x04), 0x00, 0x00].from4Arrayto32Int();
}

FAParams.nullOffset = function(ch)
{
  return 0;
}

FAParams.prototype.addrToString = function()
{
  var result = "0x";
  var ary = this.addr.to4Array();
  var tmp;
  for (i = 0; i < 4; i++) {
    tmp = ary[i].toString(16);
    if (tmp.length == 1) tmp = "0" + tmp;
    result += tmp;
  }
  return result;
}

FAParams.prototype.recieve = function()
{
  FAParams.fa.sendRQ1(this.addr.to4Array(), this.total_size.to4Array())
}

FAParams.recieveAll = function()
{
  FAParams.allParams.forEach(function(fap) {
    fap.recieve();
  });
}

FAParams.prototype.connect = function(start_addr, size, mean, ctrl_obj, sendToCtrl, getFromCtrl)
{
  var ctrl = new Object();
  ctrl['start_addr'] = start_addr;
  ctrl['size'] = size;
  ctrl['ctrl_obj'] = ctrl_obj;
  ctrl['sendToCtrl'] = sendToCtrl;
  ctrl['getFromCtrl'] = getFromCtrl;
  ctrl['mean'] = mean; // dataの値が何を意味するのか。Optionとか
  ctrl['parent'] = this;
  if (ctrl_obj != null) {
    if (ctrl_obj.prop('tagName') == 'BUTTON') {
      $(ctrl_obj).on('click', function(){
        getFromCtrl(ctrl)});
    } else {
      ctrl_obj.change(function(){getFromCtrl(ctrl)});
    }
  }
  if (sendToCtrl != null) this.ctrls.push(ctrl);
}

FAParams.prototype.connectInput = function(start_addr, size, ctrl_obj)
{
  this.connect(start_addr, size, null, ctrl_obj, FAParams.toInput, FAParams.fromInput);
}

FAParams.prototype.connectSelect = function(start_addr, ctrl_obj)
{
  this.connect(start_addr, 1, null, ctrl_obj, FAParams.toSelect, FAParams.fromSelect);
}

FAParams.prototype.connectCheck = function(start_addr, ctrl_obj, on_value)
{
  this.connect(start_addr, 1, [0, on_value], ctrl_obj, FAParams.toCheck, FAParams.fromCheck);
}

FAParams.prototype.connectButton = function(start_addr, ctrl_obj, send_value)
{
  this.connect(start_addr, 1, null, ctrl_obj, null, function(d){
    var addr = d['start_addr'];
    d['parent'].data[addr] = send_value;
    FAParams.fa.sendDT1((d['parent'].addr).to4Array(), d['parent'].data);
  });
}

FAParams.toInput = function(d)
{
  var addr = d['start_addr'];
  var size = d['size'];
  var text = d['parent'].data.slice(addr, addr + size).toStringfromCharCode().rtrim();
  d['ctrl_obj'].val(text);
}

FAParams.fromInput = function(d)
{
  var text = d['ctrl_obj'].val();
  var addr = d['start_addr'];
  var size = d['size'];
  for (var i = 0; i < text.length; i++) d['parent'].data[addr + i] = text.charCodeAt(i);
  for (var i = text.length; i < size; i++) d['parent'].data[addr + i] = 0x20;
  FAParams.fa.sendDT1((addr + d['parent'].addr).to4Array(), d['parent'].data.slice(addr, addr + size));
}

FAParams.toCheck = function(d)
{
  var addr = d['start_addr'];
  var size = d['size'];
  var value = d['parent'].data[addr];
  var mean = d['mean'];
  // mean[0] : Offの時の値
  // mean[1] : Onの時の値
  if (value == mean[0]) {
    d['ctrl_obj'].prop('checked', false);
    d['ctrl_obj'].button('option', 'label', 'OFF');
  } else {
    d['ctrl_obj'].prop('checked', true);
    d['ctrl_obj'].button('option', 'label', 'ON');
  }
  d['ctrl_obj'].button('refresh');
}

FAParams.fromCheck = function(d)
{
  var addr = d['start_addr'];
  var size = d['size'];
  var mean = d['mean'];

  if (d['ctrl_obj'].prop('checked')) {
    d['parent'].data[addr] = mean[1];
    d['ctrl_obj'].button('option', 'label', 'ON');
  } else {
    d['parent'].data[addr] = mean[0];
    d['ctrl_obj'].button('option', 'label', 'OFF');
  }
  d['ctrl_obj'].button('refresh');
  FAParams.fa.sendDT1((d['parent'].addr).to4Array(), d['parent'].data);
}

FAParams.toSelect = function(d)
{
  var addr = d['start_addr'];
  var value = d['parent'].data[addr];
  d['ctrl_obj'].val(value);

}

FAParams.fromSelect = function(d)
{
  var addr = d['start_addr'];
  d['parent'].data[addr] = d['ctrl_obj'].val();
  FAParams.fa.sendDT1((d['parent'].addr).to4Array(), d['parent'].data);
}
