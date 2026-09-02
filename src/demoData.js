export const ROUTE_LISTS = [
  {
    id: "12",
    name: "Körlista 12",
    area: "Ekholmen",
    color: "#1765c1",
    binCount: 86,
  },
  {
    id: "18",
    name: "Körlista 18",
    area: "Johannelund",
    color: "#0f9fa3",
    binCount: 74,
  },
  {
    id: "23",
    name: "Körlista 23",
    area: "Vimanshäll",
    color: "#7c65c4",
    binCount: 91,
  },
  {
    id: "31",
    name: "Körlista 31",
    area: "Berga",
    color: "#f2a62c",
    binCount: 102,
  },
  {
    id: "44",
    name: "Körlista 44",
    area: "Tannefors",
    color: "#8091a8",
    binCount: 89,
  },
];

export const DEFAULT_SELECTED_ROUTE_IDS = ["12", "18"];

export const DEMO_POLYGON = {
  id: "demo-polygon",
  type: "Feature",
  properties: { demo: true },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [15.6308, 58.3928],
        [15.6367, 58.3995],
        [15.6514, 58.4019],
        [15.6626, 58.3952],
        [15.6655, 58.3883],
        [15.6566, 58.3812],
        [15.6435, 58.3802],
        [15.6342, 58.3849],
        [15.6308, 58.3928],
      ],
    ],
  },
};

export const OUTAGE_REASONS = [
  {
    id: "vehicle",
    label: "Fordonshaveri",
    message:
      "Sopbilen har fått ett tekniskt fel och hämtningen blir därför försenad. Vi återkommer så snart vi kan.",
  },
  {
    id: "road",
    label: "Oframkomlig väg",
    message:
      "Vi kan för närvarande inte komma fram till din adress. Hämtningen blir därför försenad och utförs så snart vägen är framkomlig igen.",
  },
  {
    id: "weather",
    label: "Väderhinder",
    message:
      "Besvärliga väderförhållanden påverkar dagens hämtning. Vi återkommer så snart hämtningen kan genomföras säkert.",
  },
  {
    id: "other",
    label: "Annan orsak",
    message:
      "Dagens hämtning är försenad. Vi arbetar för att genomföra den så snart som möjligt.",
  },
];

const INSIDE_STREETS = [
  [[15.6400, 58.3830], [15.6470, 58.3844]],
  [[15.6510, 58.3828], [15.6560, 58.3848]],
  [[15.6380, 58.3850], [15.6440, 58.3868]],
  [[15.6480, 58.3845], [15.6540, 58.3862]],
  [[15.6570, 58.3850], [15.6610, 58.3867]],
  [[15.6365, 58.3873], [15.6420, 58.3890]],
  [[15.6450, 58.3870], [15.6500, 58.3887]],
  [[15.6530, 58.3875], [15.6600, 58.3890]],
  [[15.6340, 58.3905], [15.6405, 58.3912]],
  [[15.6425, 58.3902], [15.6480, 58.3918]],
  [[15.6515, 58.3905], [15.6595, 58.3918]],
  [[15.6350, 58.3928], [15.6410, 58.3940]],
  [[15.6430, 58.3923], [15.6490, 58.3940]],
  [[15.6510, 58.3928], [15.6590, 58.3942]],
  [[15.6380, 58.3950], [15.6440, 58.3965]],
  [[15.6460, 58.3950], [15.6510, 58.3968]],
  [[15.6405, 58.3970], [15.6470, 58.3988]],
];

const INSIDE_STREETS_ALT = [
  [[15.6390, 58.3840], [15.6430, 58.3852]],
  [[15.6470, 58.3828], [15.6510, 58.3842]],
  [[15.6540, 58.3840], [15.6590, 58.3852]],
  [[15.6375, 58.3862], [15.6420, 58.3870]],
  [[15.6440, 58.3856], [15.6490, 58.3867]],
  [[15.6520, 58.3860], [15.6570, 58.3870]],
  [[15.6380, 58.3880], [15.6430, 58.3895]],
  [[15.6460, 58.3876], [15.6510, 58.3890]],
  [[15.6550, 58.3880], [15.6600, 58.3895]],
  [[15.6360, 58.3900], [15.6410, 58.3910]],
  [[15.6440, 58.3905], [15.6490, 58.3918]],
  [[15.6530, 58.3900], [15.6580, 58.3912]],
  [[15.6370, 58.3920], [15.6420, 58.3932]],
  [[15.6450, 58.3920], [15.6500, 58.3935]],
  [[15.6540, 58.3925], [15.6590, 58.3938]],
  [[15.6390, 58.3945], [15.6440, 58.3958]],
  [[15.6470, 58.3948], [15.6520, 58.3960]],
  [[15.6410, 58.3967], [15.6460, 58.3980]],
  [[15.6440, 58.3970], [15.6490, 58.3985]],
];

const ROUTE_STREETS = {
  "12": [
    [[15.6060, 58.4016], [15.6130, 58.4031]],
    [[15.6140, 58.4027], [15.6210, 58.4040]],
    [[15.6222, 58.4038], [15.6292, 58.4048]],
    [[15.6110, 58.3992], [15.6172, 58.4004]],
    [[15.6190, 58.3996], [15.6260, 58.4010]],
    [[15.6042, 58.3966], [15.6113, 58.3977]],
    [[15.6132, 58.3965], [15.6204, 58.3978]],
    [[15.6221, 58.3968], [15.6288, 58.3981]],
    [[15.6062, 58.3937], [15.6130, 58.3948]],
    [[15.6153, 58.3935], [15.6220, 58.3947]],
    [[15.6234, 58.3937], [15.6294, 58.3947]],
    [[15.6049, 58.3906], [15.6111, 58.3918]],
    [[15.6132, 58.3903], [15.6204, 58.3915]],
    [[15.6218, 58.3904], [15.6284, 58.3917]],
    [[15.6061, 58.3870], [15.6130, 58.3882]],
    [[15.6150, 58.3867], [15.6217, 58.3880]],
    [[15.6229, 58.3868], [15.6293, 58.3879]],
    [[15.6080, 58.3834], [15.6151, 58.3846]],
    [[15.6170, 58.3827], [15.6240, 58.3840]],
    [[15.6222, 58.3796], [15.6291, 58.3807]],
  ],
  "18": [
    [[15.6570, 58.4051], [15.6641, 58.4063]],
    [[15.6660, 58.4055], [15.6730, 58.4067]],
    [[15.6750, 58.4046], [15.6824, 58.4058]],
    [[15.6840, 58.4027], [15.6904, 58.4038]],
    [[15.6700, 58.4018], [15.6765, 58.4029]],
    [[15.6783, 58.3998], [15.6851, 58.4010]],
    [[15.6870, 58.3976], [15.6930, 58.3988]],
    [[15.6691, 58.3982], [15.6752, 58.3994]],
    [[15.6770, 58.3958], [15.6835, 58.3970]],
    [[15.6850, 58.3936], [15.6914, 58.3948]],
    [[15.6681, 58.3945], [15.6745, 58.3957]],
    [[15.6761, 58.3920], [15.6827, 58.3932]],
    [[15.6840, 58.3898], [15.6903, 58.3910]],
    [[15.6680, 58.3907], [15.6742, 58.3918]],
    [[15.6757, 58.3882], [15.6822, 58.3893]],
    [[15.6838, 58.3860], [15.6900, 58.3872]],
    [[15.6683, 58.3869], [15.6748, 58.3880]],
    [[15.6760, 58.3842], [15.6826, 58.3854]],
    [[15.6680, 58.3828], [15.6740, 58.3839]],
  ],
  "23": [
    [[15.6035, 58.394], [15.6205, 58.393]],
    [[15.606, 58.389], [15.623, 58.386]],
    [[15.611, 58.382], [15.629, 58.379]],
    [[15.617, 58.3755], [15.6405, 58.3768]],
  ],
  "31": [
    [[15.601, 58.405], [15.618, 58.402]],
    [[15.603, 58.399], [15.618, 58.397]],
    [[15.597, 58.388], [15.615, 58.384]],
    [[15.6005, 58.379], [15.623, 58.375]],
  ],
  "44": [
    [[15.676, 58.409], [15.693, 58.407]],
    [[15.681, 58.403], [15.695, 58.399]],
    [[15.679, 58.392], [15.695, 58.388]],
    [[15.6705, 58.3785], [15.691, 58.381]],
  ],
};

const ROUTE_ADDRESS_STREETS = {
  "12": ["Hamngatan", "Ekholmsvägen", "Hässlegatan", "Tröskaregatan", "Järdalavägen"],
  "18": ["Munkhagsgatan", "Skogslyckegatan", "Johannelundsvägen", "Tivedsvägen"],
  "23": ["Vårbruksgatan", "Vistvägen", "Plöjaregatan", "Vimanshällsvägen"],
  "31": ["Bergavägen", "Haningeleden", "Bäckagatan", "Grenadjärgatan"],
  "44": ["Nya Tanneforsvägen", "Tegelbruksgatan", "Augustbergsgatan", "Kallerstadleden"],
};

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pointAlongStreet(streets, index, random, jitterAmount = 0.00028) {
  const street = streets[index % streets.length];
  const [start, end] = street;
  const t = 0.08 + random() * 0.84;
  const longitude = start[0] + (end[0] - start[0]) * t;
  const latitude = start[1] + (end[1] - start[1]) * t;
  const longitudeJitter = (random() - 0.5) * jitterAmount;
  const latitudeJitter = (random() - 0.5) * jitterAmount * 0.86;
  return [longitude + longitudeJitter, latitude + latitudeJitter];
}

function makeRoutePoints({
  route,
  count,
  streets,
  idOffset = 0,
  customerIds,
  seed,
  jitterAmount,
}) {
  const random = seededRandom(seed);
  const addressStreets = ROUTE_ADDRESS_STREETS[route.id];

  return Array.from({ length: count }, (_, index) => {
    const sequence = idOffset + index + 1;
    const pointId = `${route.id}-${sequence}`;
    const street = addressStreets[(sequence - 1) % addressStreets.length];
    const houseNumber = pointId === "12-1" ? 14 : 2 + ((sequence * 4 + Number(route.id)) % 68);

    return {
      type: "Feature",
      id: pointId,
      properties: {
        id: pointId,
        propertyId: pointId,
        address: `${street} ${houseNumber}`,
        routeId: route.id,
        routeName: route.name,
        area: route.area,
        routeColor: route.color,
        customerId:
          customerIds?.[index] ||
          `KUND-${route.id}-${String(Math.floor(index * 0.82) + 1).padStart(3, "0")}`,
      },
      geometry: {
        type: "Point",
        coordinates: pointAlongStreet(streets, index, random, jitterAmount),
      },
    };
  });
}

const insideCustomerIds = Array.from({ length: 47 }, (_, index) =>
  index < 39 ? `KUND-DEMO-${String(index + 1).padStart(2, "0")}` : `KUND-DEMO-${String(index - 38).padStart(2, "0")}`,
);

const route12 = ROUTE_LISTS[0];
const route18 = ROUTE_LISTS[1];

const demoPoints = [
  ...makeRoutePoints({
    route: route12,
    count: 28,
    streets: INSIDE_STREETS,
    customerIds: insideCustomerIds.slice(0, 28),
    seed: 1201,
    jitterAmount: 0.00022,
  }),
  ...makeRoutePoints({
    route: route18,
    count: 19,
    streets: INSIDE_STREETS_ALT,
    customerIds: insideCustomerIds.slice(28),
    seed: 1801,
    jitterAmount: 0.00022,
  }),
];

const remainingSelectedPoints = [
  ...makeRoutePoints({
    route: route12,
    count: route12.binCount - 28,
    streets: ROUTE_STREETS[route12.id],
    idOffset: 28,
    seed: 1212,
    jitterAmount: 0.00095,
  }),
  ...makeRoutePoints({
    route: route18,
    count: route18.binCount - 19,
    streets: ROUTE_STREETS[route18.id],
    idOffset: 19,
    seed: 1818,
    jitterAmount: 0.00095,
  }),
];

const remainingRoutes = ROUTE_LISTS.slice(2).flatMap((route, index) =>
  makeRoutePoints({
    route,
    count: route.binCount,
    streets: ROUTE_STREETS[route.id],
    seed: 2300 + index * 913,
    jitterAmount: 0.00085,
  }),
);

export const PICKUP_POINTS = [
  ...demoPoints,
  ...remainingSelectedPoints,
  ...remainingRoutes,
];

export const MAP_VIEW = {
  center: [15.648, 58.3915],
  zoom: 13.25,
  maxBounds: [
    [15.575, 58.35],
    [15.72, 58.43],
  ],
};
