/*
 Highstock JS v11.0.0 (2023-04-26)

 Data grouping module

 (c) 2010-2021 Torstein Hnsi

 License: www.highcharts.com/license
*/
"use strict";
(function (a) {
  "object" === typeof module && module.exports
    ? ((a["default"] = a), (module.exports = a))
    : "function" === typeof define && define.amd
    ? define("highcharts/modules/datagrouping", ["highcharts"], function (l) {
        a(l);
        a.Highcharts = l;
        return a;
      })
    : a("undefined" !== typeof Highcharts ? Highcharts : void 0);
})(function (a) {
  function l(a, n, k, g) {
    a.hasOwnProperty(n) ||
      ((a[n] = g.apply(null, k)),
      "function" === typeof CustomEvent &&
        window.dispatchEvent(
          new CustomEvent("HighchartsModuleLoaded", {
            detail: { path: n, module: a[n] },
          })
        ));
  }
  a = a ? a._modules : {};
  l(a, "Extensions/DataGrouping/ApproximationRegistry.js", [], function () {
    return {};
  });
  l(
    a,
    "Extensions/DataGrouping/ApproximationDefaults.js",
    [
      a["Extensions/DataGrouping/ApproximationRegistry.js"],
      a["Core/Utilities.js"],
    ],
    function (a, n) {
      function k(b) {
        const a = b.length;
        b = g(b);
        f(b) && a && (b = F(b / a));
        return b;
      }
      function g(a) {
        let b = a.length,
          d;
        if (!b && a.hasNulls) d = null;
        else if (b) for (d = 0; b--; ) d += a[b];
        return d;
      }
      const {
        arrayMax: p,
        arrayMin: l,
        correctFloat: F,
        extend: z,
        isNumber: f,
      } = n;
      n = {
        average: k,
        averages: function () {
          const a = [];
          [].forEach.call(arguments, function (b) {
            a.push(k(b));
          });
          return "undefined" === typeof a[0] ? void 0 : a;
        },
        close: function (a) {
          return a.length ? a[a.length - 1] : a.hasNulls ? null : void 0;
        },
        high: function (a) {
          return a.length ? p(a) : a.hasNulls ? null : void 0;
        },
        hlc: function (b, e, d) {
          b = a.high(b);
          e = a.low(e);
          d = a.close(d);
          if (f(b) || f(e) || f(d)) return [b, e, d];
        },
        low: function (a) {
          return a.length ? l(a) : a.hasNulls ? null : void 0;
        },
        ohlc: function (b, e, d, h) {
          b = a.open(b);
          e = a.high(e);
          d = a.low(d);
          h = a.close(h);
          if (f(b) || f(e) || f(d) || f(h)) return [b, e, d, h];
        },
        open: function (a) {
          return a.length ? a[0] : a.hasNulls ? null : void 0;
        },
        range: function (b, e) {
          b = a.low(b);
          e = a.high(e);
          if (f(b) || f(e)) return [b, e];
          if (null === b && null === e) return null;
        },
        sum: g,
      };
      z(a, n);
      return n;
    }
  );
  l(a, "Extensions/DataGrouping/DataGroupingDefaults.js", [], function () {
    return {
      common: {
        groupPixelWidth: 2,
        dateTimeLabelFormats: {
          millisecond: [
            "%A, %e %b, %H:%M:%S.%L",
            "%A, %e %b, %H:%M:%S.%L",
            "-%H:%M:%S.%L",
          ],
          second: ["%A, %e %b, %H:%M:%S", "%A, %e %b, %H:%M:%S", "-%H:%M:%S"],
          minute: ["%A, %e %b, %H:%M", "%A, %e %b, %H:%M", "-%H:%M"],
          hour: ["%A, %e %b, %H:%M", "%A, %e %b, %H:%M", "-%H:%M"],
          day: ["%A, %e %b %Y", "%A, %e %b", "-%A, %e %b %Y"],
          week: ["Week from %A, %e %b %Y", "%A, %e %b", "-%A, %e %b %Y"],
          month: ["%B %Y", "%B", "-%B %Y"],
          year: ["%Y", "%Y", "-%Y"],
        },
      },
      seriesSpecific: {
        line: {},
        spline: {},
        area: {},
        areaspline: {},
        arearange: {},
        column: { groupPixelWidth: 10 },
        columnrange: { groupPixelWidth: 10 },
        candlestick: { groupPixelWidth: 10 },
        ohlc: { groupPixelWidth: 5 },
        hlc: { groupPixelWidth: 5 },
        heikinashi: { groupPixelWidth: 10 },
      },
      units: [
        ["millisecond", [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]],
        ["second", [1, 2, 5, 10, 15, 30]],
        ["minute", [1, 2, 5, 10, 15, 30]],
        ["hour", [1, 2, 3, 4, 6, 8, 12]],
        ["day", [1]],
        ["week", [1]],
        ["month", [1, 3, 6]],
        ["year", null],
      ],
    };
  });
  l(
    a,
    "Extensions/DataGrouping/DataGroupingAxisComposition.js",
    [
      a["Extensions/DataGrouping/DataGroupingDefaults.js"],
      a["Core/Utilities.js"],
    ],
    function (a, n) {
      function k(a) {
        const b = this,
          h = b.series;
        h.forEach(function (a) {
          a.groupPixelWidth = void 0;
        });
        h.forEach(function (h) {
          h.groupPixelWidth = b.getGroupPixelWidth && b.getGroupPixelWidth();
          h.groupPixelWidth && (h.hasProcessed = !0);
          h.applyGrouping(!!a.hasExtremesChanged);
        });
      }
      function g() {
        const h = this.series;
        let d = h.length,
          e = 0,
          n = !1,
          f,
          w;
        for (; d--; )
          if ((w = h[d].options.dataGrouping))
            if (
              ((e = Math.max(
                e,
                b(w.groupPixelWidth, a.common.groupPixelWidth)
              )),
              (f = (h[d].processedXData || h[d].data).length),
              h[d].groupPixelWidth ||
                f > this.chart.plotSizeX / e ||
                (f && w.forced))
            )
              n = !0;
        return n ? e : 0;
      }
      function l() {
        this.series.forEach(function (a) {
          a.hasProcessed = !1;
        });
      }
      function p(a, e) {
        let h;
        e = b(e, !0);
        a || (a = { forced: !1, units: null });
        if (this instanceof d)
          for (h = this.series.length; h--; )
            this.series[h].update({ dataGrouping: a }, !1);
        else
          this.chart.options.series.forEach(function (b) {
            b.dataGrouping = "boolean" === typeof a ? a : f(a, b.dataGrouping);
          });
        this.ordinal && (this.ordinal.slope = void 0);
        e && this.chart.redraw();
      }
      const { addEvent: F, extend: z, merge: f, pick: b } = n,
        e = [];
      let d;
      return {
        compose: function (a) {
          d = a;
          n.pushUnique(e, a) &&
            (F(a, "afterSetScale", l),
            F(a, "postProcessData", k),
            z(a.prototype, {
              applyGrouping: k,
              getGroupPixelWidth: g,
              setDataGrouping: p,
            }));
        },
      };
    }
  );
  l(
    a,
    "Extensions/DataGrouping/DataGroupingSeriesComposition.js",
    [
      a["Extensions/DataGrouping/ApproximationRegistry.js"],
      a["Extensions/DataGrouping/DataGroupingDefaults.js"],
      a["Core/Axis/DateTimeAxis.js"],
      a["Core/Defaults.js"],
      a["Core/Series/SeriesRegistry.js"],
      a["Core/Utilities.js"],
    ],
    function (a, n, l, g, J, I) {
      function k(a) {
        var b = this.chart,
          d = this.options.dataGrouping,
          e = !1 !== this.allowDG && d && t(d.enabled, b.options.isStock),
          c = this.visible || !b.options.chart.ignoreHiddenSeries;
        const x = this.currentDataGrouping;
        var f = !1;
        e && !this.requireSorting && (this.requireSorting = f = !0);
        a =
          !1 ===
            !(
              this.isCartesian &&
              !this.isDirty &&
              !this.xAxis.isDirty &&
              !this.yAxis.isDirty &&
              !a
            ) || !e;
        f && (this.requireSorting = !1);
        if (!a) {
          this.destroyGroupedData();
          a = d.groupAll ? this.xData : this.processedXData;
          e = d.groupAll ? this.yData : this.processedYData;
          var k = b.plotSizeX;
          f = this.xAxis;
          var g = f.options.ordinal,
            p = this.groupPixelWidth,
            m;
          let G;
          if (p && a && a.length && k) {
            this.isDirty = G = !0;
            this.points = null;
            var q = f.getExtremes();
            var r = q.min;
            q = q.max;
            g =
              (g &&
                f.ordinal &&
                f.ordinal.getGroupIntervalFactor(r, q, this)) ||
              1;
            k = f.getTimeTicks(
              l.Additions.prototype.normalizeTimeTickInterval(
                ((p * (q - r)) / k) * g,
                d.units || n.units
              ),
              Math.min(r, a[0]),
              Math.max(q, a[a.length - 1]),
              f.options.startOfWeek,
              a,
              this.closestPointRange
            );
            p = h.groupData.apply(this, [a, e, k, d.approximation]);
            a = p.groupedXData;
            e = p.groupedYData;
            g = 0;
            d &&
              d.smoothed &&
              a.length &&
              ((d.firstAnchor = "firstPoint"),
              (d.anchor = "middle"),
              (d.lastAnchor = "lastPoint"),
              A(32, !1, b, {
                "dataGrouping.smoothed": "use dataGrouping.anchor",
              }));
            b = a;
            var y = q,
              C = this.options.dataGrouping;
            q = this.currentDataGrouping && this.currentDataGrouping.gapSize;
            if (C && this.xData && q && this.groupMap) {
              r = b.length - 1;
              var u = C.anchor;
              const a = t(C.firstAnchor, u);
              C = t(C.lastAnchor, u);
              if (u && "start" !== u) {
                var B = q * { middle: 0.5, end: 1 }[u];
                for (u = b.length - 1; u-- && 0 < u; ) b[u] += B;
              }
              a &&
                "start" !== a &&
                this.xData[0] >= b[0] &&
                ((u = this.groupMap[0].start),
                (B = this.groupMap[0].length),
                w(u) && w(B) && (m = u + (B - 1)),
                (b[0] = {
                  middle: b[0] + 0.5 * q,
                  end: b[0] + q,
                  firstPoint: this.xData[0],
                  lastPoint: m && this.xData[m],
                }[a]));
              C &&
                "start" !== C &&
                q &&
                b[r] >= y - q &&
                ((m = this.groupMap[this.groupMap.length - 1].start),
                (b[r] = {
                  middle: b[r] + 0.5 * q,
                  end: b[r] + q,
                  firstPoint: m && this.xData[m],
                  lastPoint: this.xData[this.xData.length - 1],
                }[C]));
            }
            for (m = 1; m < k.length; m++)
              (k.info.segmentStarts &&
                -1 !== k.info.segmentStarts.indexOf(m)) ||
                (g = Math.max(k[m] - k[m - 1], g));
            q = k.info;
            q.gapSize = g;
            this.closestPointRange = k.info.totalRange;
            this.groupMap = p.groupMap;
            if (c) {
              c = f;
              m = a;
              if (H(m[0]) && w(c.min) && w(c.dataMin) && m[0] < c.min) {
                if (
                  (!H(c.options.min) && c.min <= c.dataMin) ||
                  c.min === c.dataMin
                )
                  c.min = Math.min(m[0], c.min);
                c.dataMin = Math.min(m[0], c.dataMin);
              }
              if (
                H(m[m.length - 1]) &&
                w(c.max) &&
                w(c.dataMax) &&
                m[m.length - 1] > c.max
              ) {
                if (
                  (!H(c.options.max) && w(c.dataMax) && c.max >= c.dataMax) ||
                  c.max === c.dataMax
                )
                  c.max = Math.max(m[m.length - 1], c.max);
                c.dataMax = Math.max(m[m.length - 1], c.dataMax);
              }
            }
            d.groupAll &&
              ((this.allGroupedData = e),
              (d = this.cropData(a, e, f.min, f.max, 1)),
              (a = d.xData),
              (e = d.yData),
              (this.cropStart = d.start));
            this.processedXData = a;
            this.processedYData = e;
          } else this.groupMap = null;
          this.hasGroupedData = G;
          this.currentDataGrouping = q;
          this.preventGraphAnimation =
            (x && x.totalRange) !== (q && q.totalRange);
        }
      }
      function p() {
        this.groupedData &&
          (this.groupedData.forEach(function (a, b) {
            a && (this.groupedData[b] = a.destroy ? a.destroy() : null);
          }, this),
          (this.groupedData.length = 0));
      }
      function f() {
        K.apply(this);
        this.destroyGroupedData();
        this.groupedData = this.hasGroupedData ? this.points : null;
      }
      function b() {
        return this.is("arearange")
          ? "range"
          : this.is("ohlc")
          ? "ohlc"
          : this.is("hlc")
          ? "hlc"
          : this.is("column")
          ? "sum"
          : "average";
      }
      function e(b, d, e, f) {
        const c = this,
          h = c.data,
          k = c.options && c.options.data,
          n = [],
          g = [],
          p = [],
          m = b.length,
          q = !!d,
          r = [],
          x = c.pointArrayMap,
          l = x && x.length,
          u = ["x"].concat(x || ["y"]),
          B = this.options.dataGrouping && this.options.dataGrouping.groupAll;
        let y = 0,
          t = 0;
        f =
          "function" === typeof f
            ? f
            : f && a[f]
            ? a[f]
            : a[(c.getDGApproximation && c.getDGApproximation()) || "average"];
        if (l) for (var G = x.length; G--; ) r.push([]);
        else r.push([]);
        G = l || 1;
        for (let a = 0; a <= m; a++)
          if (!(b[a] < e[0])) {
            for (
              ;
              ("undefined" !== typeof e[y + 1] && b[a] >= e[y + 1]) || a === m;

            ) {
              var v = e[y];
              c.dataGroupInfo = {
                start: B ? t : c.cropStart + t,
                length: r[0].length,
              };
              var A = f.apply(c, r);
              c.pointClass &&
                !H(c.dataGroupInfo.options) &&
                ((c.dataGroupInfo.options = D(
                  c.pointClass.prototype.optionsToObject.call(
                    { series: c },
                    c.options.data[c.cropStart + t]
                  )
                )),
                u.forEach(function (a) {
                  delete c.dataGroupInfo.options[a];
                }));
              "undefined" !== typeof A &&
                (n.push(v), g.push(A), p.push(c.dataGroupInfo));
              t = a;
              for (v = 0; v < G; v++) (r[v].length = 0), (r[v].hasNulls = !1);
              y += 1;
              if (a === m) break;
            }
            if (a === m) break;
            if (x) {
              v =
                c.options.dataGrouping && c.options.dataGrouping.groupAll
                  ? a
                  : c.cropStart + a;
              v =
                (h && h[v]) ||
                c.pointClass.prototype.applyOptions.apply({ series: c }, [
                  k[v],
                ]);
              for (let a = 0; a < l; a++)
                (A = v[x[a]]),
                  w(A) ? r[a].push(A) : null === A && (r[a].hasNulls = !0);
            } else
              (v = q ? d[a] : null),
                w(v) ? r[0].push(v) : null === v && (r[0].hasNulls = !0);
          }
        return { groupedXData: n, groupedYData: g, groupMap: p };
      }
      function d(a) {
        a = a.options;
        const b = this.type,
          d = this.chart.options.plotOptions,
          e = this.useCommonDataGrouping && n.common,
          c = n.seriesSpecific;
        let f = g.defaultOptions.plotOptions[b].dataGrouping;
        if (d && (c[b] || e)) {
          const h = this.chart.rangeSelector;
          f || (f = D(n.common, c[b]));
          a.dataGrouping = D(
            e,
            f,
            d.series && d.series.dataGrouping,
            d[b].dataGrouping,
            this.userOptions.dataGrouping,
            !a.isInternal &&
              h &&
              w(h.selected) &&
              h.buttonOptions[h.selected].dataGrouping
          );
        }
      }
      const {
          series: { prototype: h },
        } = J,
        {
          addEvent: y,
          defined: H,
          error: A,
          extend: B,
          isNumber: w,
          merge: D,
          pick: t,
        } = I,
        K = h.generatePoints,
        E = [];
      return {
        compose: function (a) {
          const h = a.prototype.pointClass;
          I.pushUnique(E, h) &&
            y(h, "update", function () {
              if (this.dataGroup) return A(24, !1, this.series.chart), !1;
            });
          I.pushUnique(E, a) &&
            (y(a, "afterSetOptions", d),
            y(a, "destroy", p),
            B(a.prototype, {
              applyGrouping: k,
              destroyGroupedData: p,
              generatePoints: f,
              getDGApproximation: b,
              groupData: e,
            }));
        },
        groupData: e,
      };
    }
  );
  l(
    a,
    "Extensions/DataGrouping/DataGrouping.js",
    [
      a["Extensions/DataGrouping/DataGroupingAxisComposition.js"],
      a["Extensions/DataGrouping/DataGroupingDefaults.js"],
      a["Extensions/DataGrouping/DataGroupingSeriesComposition.js"],
      a["Core/FormatUtilities.js"],
      a["Core/Utilities.js"],
    ],
    function (a, n, k, g, l) {
      function p(a) {
        const d = this.chart,
          e = d.time,
          k = a.labelConfig,
          g = k.series;
        var l = g.tooltipOptions,
          p = g.options.dataGrouping;
        const D = g.xAxis;
        var t = l.xDateFormat;
        let z,
          E,
          x = l[a.isFooter ? "footerFormat" : "headerFormat"];
        D &&
          "datetime" === D.options.type &&
          p &&
          b(k.key) &&
          ((E = g.currentDataGrouping),
          (p = p.dateTimeLabelFormats || n.common.dateTimeLabelFormats),
          E
            ? ((l = p[E.unitName]),
              1 === E.count ? (t = l[0]) : ((t = l[1]), (z = l[2])))
            : !t &&
              p &&
              D.dateTime &&
              (t = D.dateTime.getXDateFormat(k.x, l.dateTimeLabelFormats)),
          (t = e.dateFormat(t, k.key)),
          z && (t += e.dateFormat(z, k.key + E.totalRange - 1)),
          g.chart.styledMode && (x = this.styledModeFormat(x)),
          (a.text = F(x, { point: f(k.point, { key: t }), series: g }, d)),
          a.preventDefault());
      }
      const { format: F } = g,
        { addEvent: z, extend: f, isNumber: b } = l,
        e = [];
      g = {
        compose: function (b, f, g) {
          a.compose(b);
          k.compose(f);
          g && l.pushUnique(e, g) && z(g, "headerFormatter", p);
        },
        groupData: k.groupData,
      };
      ("");
      ("");
      return g;
    }
  );
  l(
    a,
    "masters/modules/datagrouping.src.js",
    [
      a["Core/Globals.js"],
      a["Extensions/DataGrouping/ApproximationDefaults.js"],
      a["Extensions/DataGrouping/ApproximationRegistry.js"],
      a["Extensions/DataGrouping/DataGrouping.js"],
    ],
    function (a, l, k, g) {
      a.dataGrouping = { approximationDefaults: l, approximations: k };
      g.compose(a.Axis, a.Series, a.Tooltip);
    }
  );
});
//# sourceMappingURL=datagrouping.js.map