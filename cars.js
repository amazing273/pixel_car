const CAR_MODELS = [
    "Lada 2101", "Lada 2107", "Lada 2109", "Lada 2110", "Lada Priora", "Lada Granta", "Lada Vesta", "Niva 4x4", "Volga 3110", "GAZ 21",
    "Toyota Supra", "Toyota AE86", "Nissan Skyline R34", "Nissan Silvia S15", "Mazda RX-7", "Mazda RX-8", "Mitsubishi Evo X", "Subaru WRX STI", "Honda Civic Type R", "Honda NSX",
    "BMW E30", "BMW M3 E46", "BMW M5 F90", "Mercedes 190E", "Mercedes G-Class", "Audi Quattro", "Audi RS6", "Porsche 911", "VW Golf GTI", "VW Passat",
    "Ford Mustang", "Ford Focus RS", "Chevrolet Camaro", "Chevrolet Corvette", "Dodge Charger", "Dodge Challenger", "Dodge Viper", "Tesla Model S", "Tesla Roadster", "Jeep Wrangler",
    "Ferrari F40", "Ferrari Enzo", "Lamborghini Diablo", "Lamborghini Aventador", "Bugatti Veyron", "Bugatti Chiron", "McLaren F1", "McLaren P1", "Pagani Zonda", "Koenigsegg Jesko"
];

const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#ff8800', '#8800ff', '#00ff88'];

const CARS_DATABASE = [];
for (let i = 0; i < 100; i++) {
    const modelName = CAR_MODELS[i % CAR_MODELS.length] + ` (${Math.floor(i / 10) + 1})`;
    const baseSpeed = 180 + Math.floor(Math.random() * 80);
    const acceleration = 1.0 + Math.random() * 1.5;
    
    CARS_DATABASE.push({
        id: i,
        name: modelName,
        color: COLORS[i % COLORS.length],
        maxSpeed: baseSpeed,
        accel: acceleration,
        gears: Math.floor(Math.random() * 2) + 5
    });
}

let selectedCar = CARS_DATABASE[0];
