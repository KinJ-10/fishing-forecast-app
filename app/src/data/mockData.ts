import { DailySpotForecast, Spot } from "../domain/models";

export const spots: Spot[] = [
  {
    id: "daikoku",
    name: "大黒海づり施設",
    area: "横浜市鶴見区",
    beginnerLevel: "high",
    summary:
      "足場が安定した定番施設。サビキや胴付きで狙いやすく、朝夕の回遊待ちが組み立てやすい釣り場です。",
    accessNote: "駐車場前提で動きやすく、荷物が多い初心者でも入りやすい施設です。",
    features: ["足場が安定", "ファミリー向け", "回遊魚の実績が安定"],
    rules: ["ライフジャケット着用推奨", "混雑時は竿の間隔を空ける", "施設の開場時間を要確認"],
    safetyNote: "北寄りの風が強い日は外向きで仕掛けが流されやすいです。",
  },
  {
    id: "honmoku",
    name: "本牧海づり施設",
    area: "横浜市中区",
    beginnerLevel: "medium",
    summary:
      "魚種が豊富で、潮が動く時間に回遊魚と底物の両方を狙いやすい人気施設です。",
    accessNote: "公共交通でも行きやすいですが、朝の混雑時は入場待ちを見込んだ行動が必要です。",
    features: ["魚種が多い", "潮通しが良い", "周辺釣果との連動が出やすい"],
    rules: ["混雑日は入場制限に注意", "コマセの扱いは周囲に配慮", "施設スタッフの指示を優先"],
    safetyNote: "南風が上がる午後は足元まで波しぶきが届くことがあります。",
  },
  {
    id: "higashi-ogishima",
    name: "東扇島西公園",
    area: "川崎市川崎区",
    beginnerLevel: "medium",
    summary:
      "公園型の岸壁で気軽に入りやすく、回遊待ちと足元の小物釣りを両立しやすいスポットです。",
    accessNote: "公園として入りやすい反面、風を受けやすいので防寒と安全装備が重要です。",
    features: ["公園で入りやすい", "足元の小物も狙える", "周辺の釣果変化を拾いやすい"],
    rules: ["柵周辺では荷物を広げすぎない", "夜明け前は足元照明を確保", "ゴミは必ず持ち帰る"],
    safetyNote: "風向き次第で体感温度が大きく下がるため、防風対策が必要です。",
  },
];

export const forecasts: DailySpotForecast[] = [
  {
    date: "2026-04-02",
    spotId: "daikoku",
    targetSpecies: ["アジ", "イワシ", "サバ"],
    recommendedWindows: ["05:10-07:00", "16:30-18:10"],
    tide: {
      tideName: "中潮",
      highTide: "06:18",
      lowTide: "12:41",
      activeWindows: ["05:30前後", "16:40前後"],
      comment: "朝の満潮前後と夕方の上げ始めで潮が動き、回遊待ちのタイミングを作りやすい日です。",
    },
    weather: {
      windSpeedMps: 4.2,
      waveHeightM: 0.5,
      waterTempC: 15.5,
      sky: "晴れ時々くもり",
    },
    recentCatches: [
      {
        species: "アジ",
        latestCount: 34,
        trend: "up",
        note: "昨日より群れの回数が増え、朝のサビキで複数釣果が出ています。",
      },
      {
        species: "イワシ",
        latestCount: 22,
        trend: "steady",
        note: "日中は単発ですが、朝夕にまとまる傾向です。",
      },
    ],
    migrationSignals: [
      {
        species: "アジ",
        nearbySpots: ["本牧海づり施設", "東扇島西公園"],
        confidence: "high",
        note: "周辺2地点でも朝の群れ入りが続いており、同じ群れが回る期待があります。",
      },
    ],
    caution: "朝は混雑しやすいので、サビキをするなら開場直後の場所確保が重要です。",
  },
  {
    date: "2026-04-02",
    spotId: "honmoku",
    targetSpecies: ["アジ", "コノシロ", "メバル"],
    recommendedWindows: ["05:00-06:40", "17:00-18:30"],
    tide: {
      tideName: "中潮",
      highTide: "06:10",
      lowTide: "12:32",
      activeWindows: ["05:20前後", "17:10前後"],
      comment: "潮の動きが朝夕にまとまり、群れ待ちと底物狙いの両方を組み立てやすいです。",
    },
    weather: {
      windSpeedMps: 5.4,
      waveHeightM: 0.7,
      waterTempC: 15.2,
      sky: "くもりのち晴れ",
    },
    recentCatches: [
      {
        species: "アジ",
        latestCount: 41,
        trend: "up",
        note: "朝の回遊が濃く、短時間で複数本の釣果報告があります。",
      },
      {
        species: "メバル",
        latestCount: 8,
        trend: "steady",
        note: "夕まずめに足元で小型中心の反応が続いています。",
      },
    ],
    migrationSignals: [
      {
        species: "コノシロ",
        nearbySpots: ["大黒海づり施設"],
        confidence: "medium",
        note: "隣接エリアで単発ながらコノシロが確認されており、回遊待ちの価値があります。",
      },
    ],
    caution: "南寄りの風が強まると外向きはやりにくくなるため、無理せず内側中心に切り替える判断が必要です。",
  },
  {
    date: "2026-04-02",
    spotId: "higashi-ogishima",
    targetSpecies: ["サッパ", "アジ", "イワシ"],
    recommendedWindows: ["05:20-06:50", "15:50-17:20"],
    tide: {
      tideName: "中潮",
      highTide: "06:25",
      lowTide: "12:48",
      activeWindows: ["05:40前後", "16:00前後"],
      comment: "朝まずめと夕方の潮変わりが重なり、短時間勝負で群れ待ちしやすい配列です。",
    },
    weather: {
      windSpeedMps: 6.1,
      waveHeightM: 0.8,
      waterTempC: 14.8,
      sky: "晴れ",
    },
    recentCatches: [
      {
        species: "サッパ",
        latestCount: 27,
        trend: "up",
        note: "足元のサビキで連掛け報告が増えています。",
      },
      {
        species: "アジ",
        latestCount: 12,
        trend: "steady",
        note: "群れが入る時間は短いですが、朝に反応があります。",
      },
    ],
    migrationSignals: [
      {
        species: "アジ",
        nearbySpots: ["大黒海づり施設"],
        confidence: "medium",
        note: "大黒側で朝の群れが出ており、時間差で回る可能性があります。",
      },
    ],
    caution: "風を正面から受けやすいので、5m/sを超える予報なら飛ばしウキより足元中心が安全です。",
  },
  {
    date: "2026-04-03",
    spotId: "daikoku",
    targetSpecies: ["アジ", "コノシロ", "メバル"],
    recommendedWindows: ["05:40-07:10", "17:10-18:20"],
    tide: {
      tideName: "大潮",
      highTide: "06:58",
      lowTide: "13:09",
      activeWindows: ["06:00前後", "17:20前後"],
      comment: "潮位差が大きく、朝の満潮前後と夕方の上げで海が動きます。",
    },
    weather: {
      windSpeedMps: 3.6,
      waveHeightM: 0.4,
      waterTempC: 15.8,
      sky: "晴れ",
    },
    recentCatches: [
      {
        species: "アジ",
        latestCount: 29,
        trend: "steady",
        note: "朝の時合い中心ですが、昨日よりサイズがやや上向きです。",
      },
      {
        species: "メバル",
        latestCount: 6,
        trend: "up",
        note: "夕方に足元の胴付きで反応が増えています。",
      },
    ],
    migrationSignals: [
      {
        species: "コノシロ",
        nearbySpots: ["本牧海づり施設", "東扇島西公園"],
        confidence: "medium",
        note: "周辺で単発釣果が続いており、群れが差す可能性があります。",
      },
    ],
    caution: "潮が速い時間は軽すぎる仕掛けだと流されるので、予備のオモリが必要です。",
  },
  {
    date: "2026-04-03",
    spotId: "honmoku",
    targetSpecies: ["アジ", "サバ", "カサゴ"],
    recommendedWindows: ["05:30-07:00", "17:20-18:40"],
    tide: {
      tideName: "大潮",
      highTide: "06:49",
      lowTide: "13:01",
      activeWindows: ["05:50前後", "17:30前後"],
      comment: "潮通しの良さを活かしやすく、回遊魚と夕方の根魚狙いが噛み合う日です。",
    },
    weather: {
      windSpeedMps: 4.9,
      waveHeightM: 0.6,
      waterTempC: 15.3,
      sky: "晴れ時々くもり",
    },
    recentCatches: [
      {
        species: "アジ",
        latestCount: 38,
        trend: "up",
        note: "朝のサビキで安定しており、初心者にも組み立てやすい状況です。",
      },
      {
        species: "カサゴ",
        latestCount: 11,
        trend: "steady",
        note: "夕方に足元で拾える状況が続いています。",
      },
    ],
    migrationSignals: [
      {
        species: "サバ",
        nearbySpots: ["大黒海づり施設"],
        confidence: "high",
        note: "大黒側でサバ混じりの群れが増えており、本牧にも回る期待があります。",
      },
    ],
    caution: "人気施設なので、朝まずめ狙いなら入場待ちを見込んで早めの到着が必要です。",
  },
  {
    date: "2026-04-03",
    spotId: "higashi-ogishima",
    targetSpecies: ["サッパ", "コノシロ", "アジ"],
    recommendedWindows: ["05:50-07:00", "16:40-17:50"],
    tide: {
      tideName: "大潮",
      highTide: "07:05",
      lowTide: "13:16",
      activeWindows: ["06:10前後", "16:50前後"],
      comment: "朝の上げ止まり前後は足元まで魚が寄りやすく、短時間の数釣りに向きます。",
    },
    weather: {
      windSpeedMps: 6.5,
      waveHeightM: 0.9,
      waterTempC: 14.9,
      sky: "くもり",
    },
    recentCatches: [
      {
        species: "サッパ",
        latestCount: 31,
        trend: "up",
        note: "朝の足元サビキで反応が継続しています。",
      },
      {
        species: "コノシロ",
        latestCount: 7,
        trend: "steady",
        note: "回遊時間は短いですが、群れに当たると連発します。",
      },
    ],
    migrationSignals: [
      {
        species: "アジ",
        nearbySpots: ["本牧海づり施設"],
        confidence: "low",
        note: "本牧では出ていますが、東扇島までは時間差がありそうです。",
      },
    ],
    caution: "風が強めなので、初心者は重めの仕掛けか足元サビキに絞った方が扱いやすいです。",
  },
];
