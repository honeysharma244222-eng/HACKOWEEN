let backendOnline = false;
let backendSyncing = false;
let backendAttempted = false;
let backendLeaderboard = [];

async function backendRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('x-user-id', P().id);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(API + path, { ...options, headers });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Backend returned an invalid response (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(data.error || `Backend request failed (${response.status}).`);
  }
  return data;
}

function showBackendError(error) {
  console.error('Backend request failed:', error);
  toast(`Backend error: ${error.message}`);
}

async function syncBackend() {
  if (backendSyncing) return;
  backendSyncing = true;
  try {
    const health = await fetch(`${API}/health`);
    if (!health.ok) throw new Error(`Backend health check failed (${health.status}).`);
    const [nodes, partners, listings, stats, profile, impact, orders, rescues, needs,
      notifications, leaderboard, delivery] = await Promise.all([
      backendRequest('/nodes'),
      backendRequest('/partners'),
      backendRequest('/listings'),
      backendRequest('/stats'),
      backendRequest('/profile'),
      backendRequest('/profile/impact'),
      backendRequest('/orders'),
      backendRequest('/rescues'),
      backendRequest('/rescues/needs'),
      backendRequest('/notifications'),
      backendRequest('/leaderboard'),
      backendRequest('/delivery/jobs')
    ]);
    const activeRecord = orders.find(order => order.status !== 'delivered');
    const tracking = activeRecord
      ? await backendRequest(`/orders/${activeRecord.id}/track`)
      : null;

    nodes.forEach(node => {
      NODES[node.id] = { n: esc(node.name), x: node.x, y: node.y, t: node.type };
    });
    PARTNERS.splice(0, PARTNERS.length, ...partners.map(partner => ({
      id: partner.id, n: esc(partner.name), x: partner.x, y: partner.y, rating: partner.rating
    })));
    S.l = listings.map(listing => ({
      id: listing.id,
      e: esc(listing.emoji),
      name: esc(listing.name),
      d: listing.donor_id,
      qty: listing.qty,
      mode: listing.mode,
      price: listing.price,
      min: Math.max(0, Math.ceil((listing.expires_at - now()) / 60000)),
      cat: listing.category,
      veg: listing.veg,
      exp: listing.expires_at
    }));
    S.stats = { ...S.stats, ...stats };
    S.profile = {
      ...P(),
      name: profile.name || 'Guest User',
      phone: profile.phone || '',
      email: profile.email || '',
      addr: profile.addr || '',
      diet: profile.diet || 'any',
      av: profile.av || '🌾',
      theme: profile.theme || 'auto',
      role: profile.role || 'get'
    };
    S.role = ROLES[S.profile.role] ? S.profile.role : 'get';
    S.pts = impact.points;
    S.earn = impact.earn;
    S.jobs = Array.from({ length: impact.deliveries }, (_, index) => index);
    S.online = delivery.online;
    S.orders = orders.map(order => ({
      ...order,
      d: order.donor_id,
      t: order.progress,
      done: order.status === 'delivered',
      items: order.items.map(item => ({ n: item.name, c: item.qty, price: item.price }))
    }));
    const activeOrder = S.orders.find(order => !order.done);
    live = activeOrder
      ? {
          ...activeOrder,
          s: -1,
          partnerName: tracking?.partner,
          partnerRating: tracking?.rating
        }
      : null;
    S.rescues = rescues.map(rescue => ({
      id: rescue.id,
      qty: rescue.qty,
      from: rescue.from_id,
      to: rescue.to_id,
      exp: rescue.expires_at,
      name: esc(rescue.name),
      e: esc(rescue.emoji),
      ev: esc(rescue.event),
      partner: Math.max(0, PARTNERS.findIndex(partner => partner.id === rescue.partner_id)),
      pt: rescue.progress,
      done: rescue.status === 'done',
      tries: Array.from({ length: rescue.tries }, (_, index) => index)
    }));
    S.need = Object.fromEntries(needs.map(hub => [hub.id, hub.need]));
    S.notes = notifications.map(notification => ({
      id: notification.id,
      i: esc(notification.icon),
      t: esc(notification.text),
      at: notification.created_at
    }));
    S.seen = Math.min(S.seen, S.notes.length);
    backendLeaderboard = leaderboard;
    backendOnline = true;
    backendAttempted = true;
    Object.keys(cart).forEach(id => {
      const listing = S.l.find(item => item.id == id);
      if (!listing) delete cart[id];
      else cart[id] = Math.min(cart[id], listing.qty, 6);
      if (cart[id] <= 0) delete cart[id];
    });
    applyTheme();
    save();
    nav();
    head();
    if (!document.activeElement.matches('input,select,textarea')) render();
  } catch (error) {
    const wasOnline = backendOnline;
    backendOnline = false;
    if (wasOnline || !backendAttempted) {
      showBackendError(new Error(`Unable to sync with the backend. ${error.message}`));
    }
  } finally {
    backendAttempted = true;
    backendSyncing = false;
  }
}

HELP.profile = 'Manage your profile, preferences, and account details.';
TABS.push(['profile', '👤', 'Profile']);
Object.values(ROLES).forEach(role => role.t.push('profile'));

render = function () {
  ({ explore: rExplore, map: rMap, rescue: rRescue, deliver: rDeliver,
    activity: rAct, profile: rProfile })[tab]();
  cartUI();
};

const originalViewClick = $('#v').onclick;
$('#v').onclick = async event => {
  const button = event.target.closest('button');
  if (!button) return originalViewClick(event);
  const data = button.dataset;
  try {
    if (backendOnline && data.job) {
      await backendRequest('/delivery/accept', {
        method: 'POST',
        body: JSON.stringify({ listingId: Number(data.job) })
      });
      await syncBackend();
      toast('Delivery completed and recorded.');
      return;
    }
    if (backendOnline && data.fail) {
      await backendRequest(`/rescues/${data.fail}/fail`, { method: 'POST' });
      await syncBackend();
      toast('A replacement delivery partner was assigned.');
      return;
    }
    if (backendOnline && data.spot) {
      await alertSpot(Number(data.spot));
      return;
    }
  } catch (error) {
    showBackendError(error);
    return;
  }
  originalViewClick(event);
};

const originalRoleClick = $('#roles').onclick;
$('#roles').onclick = async event => {
  const button = event.target.closest('button');
  originalRoleClick(event);
  if (!button || !backendOnline) return;
  try {
    await backendRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify({ ...P(), role: S.role })
    });
    await syncBackend();
  } catch (error) {
    showBackendError(error);
  }
};

const originalRescueRender = rRescue;
rRescue = function () {
  originalRescueRender();
  $('#rb').onclick = async () => {
    const name = $('#r1').value.trim();
    if (!name) return toast('Add the food name first');
    const qty = Math.max(1, Number($('#r2').value) || 1);
    const minutes = Math.max(10, Number($('#r3').value) || 60);
    if (!backendOnline) {
      report($('#r4').value, name, qty, minutes, $('#r0').value);
      return rRescue();
    }
    try {
      await backendRequest('/rescues', {
        method: 'POST',
        body: JSON.stringify({
          src: $('#r4').value,
          name,
          qty,
          minutes,
          event: $('#r0').value
        })
      });
      await syncBackend();
      toast('Food report saved and shelters notified.');
    } catch (error) {
      showBackendError(error);
    }
  };
};

const originalDeliveryRender = rDeliver;
rDeliver = function () {
  originalDeliveryRender();
  const localOnlineClick = $('#on').onclick;
  $('#on').onclick = async () => {
    if (!backendOnline) return localOnlineClick();
    try {
      await backendRequest('/delivery/online', {
        method: 'POST',
        body: JSON.stringify({ online: !S.online })
      });
      await syncBackend();
    } catch (error) {
      showBackendError(error);
    }
  };
};

const originalOrderClick = $('#co').onclick;
$('#co').onclick = async () => {
  if (!backendOnline) return originalOrderClick();
  const items = Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty }));
  if (!items.length) return;
  try {
    await backendRequest('/orders', { method: 'POST', body: JSON.stringify({ items }) });
    cart = {};
    tab = 'map';
    await syncBackend();
    toast('Order confirmed. Tracking is updated from the backend.');
  } catch (error) {
    showBackendError(error);
  }
};

$('#profbtn').onclick = () => {
  tab = 'profile';
  nav();
  render();
};

const originalProfileRender = rProfile;
rProfile = function () {
  originalProfileRender();
  $('#psave').onclick = async () => {
    const name = $('#p1').value.trim();
    if (!name) return toast('Please enter your name');
    Object.assign(P(), {
      name,
      phone: $('#p2').value.trim(),
      email: $('#p3').value.trim(),
      addr: $('#p4').value.trim(),
      diet: $('#p5').value,
      theme: $('#p6').value,
      role: S.role
    });
    applyTheme();
    save();
    if (!backendOnline) return toast('Profile saved locally; backend is unavailable.');
    try {
      await backendRequest('/profile', { method: 'PUT', body: JSON.stringify(P()) });
      await syncBackend();
      toast('Profile saved.');
    } catch (error) {
      showBackendError(error);
    }
  };
};

const originalTrackHTML = trackHTML;
trackHTML = function () {
  const markup = originalTrackHTML();
  if (!live?.partnerName) return markup;
  return markup.replace(
    'Partner: Ravi K. · ⭐ 4.9',
    `Partner: ${live.partnerName} · ⭐ ${live.partnerRating}`
  );
};

const originalActivityRender = rAct;
rAct = function () {
  originalActivityRender();
  if (!backendOnline) return;
  const card = [...document.querySelectorAll('.card')]
    .find(element => element.querySelector('h3')?.textContent === 'Community leaderboard');
  if (!card) return;
  card.innerHTML = `<h3>Community leaderboard</h3>${backendLeaderboard.map(item =>
    `<div class="lb"><span>${item.rank}. ${esc(item.name)}</span><b>${item.points}</b></div>`
  ).join('')}`;
};

startScan = async function () {
  sat = true;
  scan = 1;
  scanP = 0;
  spots = [];
  rMap();
  if (!backendOnline) return;
  try {
    const results = await backendRequest('/scan', {
      method: 'POST',
      body: JSON.stringify({})
    });
    spots = results.map(result => ({
      id: result.id, n: result.name, x: result.x, y: result.y, p: result.portions
    }));
    scanP = 1;
    scan = 2;
    rMap();
  } catch (error) {
    scan = 0;
    showBackendError(error);
    rMap();
  }
};

alertSpot = async function (id) {
  const spot = spots.find(item => item.id === id);
  if (!spot) return;
  const donors = Object.entries(NODES).filter(([, node]) => node.t === 'donor');
  const source = donors.sort((a, b) =>
    Math.hypot(a[1].x - spot.x, a[1].y - spot.y) -
    Math.hypot(b[1].x - spot.x, b[1].y - spot.y)
  )[0]?.[0];
  if (!source) return toast('No food donor is available for this report.');
  try {
    if (backendOnline) {
      await backendRequest('/rescues', {
        method: 'POST',
        body: JSON.stringify({
          src: source, name: `${spot.n} leftovers`, qty: spot.p, minutes: 60,
          event: 'Satellite scan'
        })
      });
      await syncBackend();
    } else {
      report(source, `${spot.n} leftovers`, spot.p, 60, 'Satellite scan');
    }
    spots = spots.filter(item => item.id !== id);
    rMap();
  } catch (error) {
    showBackendError(error);
  }
};

setInterval(syncBackend, 5000);

syncBackend().catch(showBackendError);
