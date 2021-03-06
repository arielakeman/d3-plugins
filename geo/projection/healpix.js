var healpixParallel = 41 + 48 / 36 + 37 / 3600; // TODO automate

function healpix(h) {
  var lambert = d3.geo.cylindricalEqualArea.raw(0),
      φ0 = healpixParallel * π / 180,
      dx0 = lambert(π, 0)[0] - lambert(-π, 0)[0],
      dx1 = d3.geo.collignon.raw(π, φ0)[0] - d3.geo.collignon.raw(-π, φ0)[0],
      y0 = lambert(0, φ0)[1],
      y1 = d3.geo.collignon.raw(0, φ0)[1],
      dy1 = d3.geo.collignon.raw(0, π / 2)[1] - y1,
      k = 2 * π / h;

  return function(λ, φ) {
    var point;
    if (Math.abs(φ) > φ0) {
      var i = Math.min(h - 1, Math.max(0, Math.floor((λ + π) / k)));
      λ = λ + π * (h - 1) / h - i * k;
      point = d3.geo.collignon.raw(λ, Math.abs(φ));
      point[0] = point[0] * dx0 / dx1 - dx0 * (h - 1) / (2 * h) + i * dx0 / h;
      point[1] = y0 + (point[1] - y1) * 4 * dy1 / dx0;
      if (φ < 0) point[1] = -point[1];
    } else {
      point = lambert(λ, φ);
    }
    point[0] /= 2;
    return point;
  };
}

function healpixProjection() {
  var n = 2,
      m = projectionMutator(healpix),
      p = m(n),
      stream_ = p.stream;

  p.lobes = function(_) {
    if (!arguments.length) return n;
    return m(n = +_);
  };

  p.stream = function(stream) {
    var rotate = p.rotate(),
        rotateStream = stream_(stream),
        sphereStream = (p.rotate([0, 0]), stream_(stream));
    p.rotate(rotate);
    rotateStream.sphere = function() { d3.geo.stream(sphere(), sphereStream); };
    return rotateStream;
  };

  function sphere() {
    var step = 180 / n;
    return {
      type: "Polygon",
      coordinates: [
        d3.range(-180, 180 + step / 2, step).map(function(x, i) { return [x, i & 1 ? 90 - 1e-6 : healpixParallel]; })
        .concat(d3.range(180, -180 - step / 2, -step).map(function(x, i) { return [x, i & 1 ? -90 + 1e-6 : -healpixParallel]; }))
      ]
    };
  }

  return p;
}

(d3.geo.healpix = healpixProjection).raw = healpix;
