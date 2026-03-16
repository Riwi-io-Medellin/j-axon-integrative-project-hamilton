/* dato del sistema  */

let assets = [
    { status: "active" },
    { status: "active" },
    { status: "active" },
    { status: "maintenance" }
];

let tickets = [
    { status: "open" },
    { status: "closed" },
    { status: "open" }
];

let preventiveCosts = [
    450,380,520,300,640,450,
    390,520,300,660,780,420
];

let correctiveCosts = [
    350,460,300,560,430,480,
    290,420,600,310,200,260
];


/* METRICS */

function calculateMetrics()
{

    let investment = 15100;
    let maintenance = preventiveCosts.reduce(
        (a,b)=>a+b ,0
    );
    let hoursSaved = preventiveCosts.length * 3;
    let closed = tickets.filter(
        t=>t.status==="closed"
    ).length;
    let rate = Math.round(
        (closed/tickets.length)*100
    ) || 0;
    document.getElementById("totalInvestment").textContent =
        "$"+investment;
    document.getElementById("maintenanceCost").textContent =
        "$"+maintenance;
    document.getElementById("savedHours").textContent =
        hoursSaved+"h";
    document.getElementById("resolutionRate").textContent =
        rate+"%";
}


/* LINE CHART */

const costChart = new Chart(
    document.getElementById("costChart"),
    {
        type:"line",
        data:{
            labels:[
                "Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct",
                "Nov","Dec","Jan","Feb"
            ],
            datasets:[
                {
                    label:"Preventive",
                    data:preventiveCosts,
                    fill:true
                },
                {
                    label:"Corrective",
                    data:correctiveCosts,
                    fill:true
                }
            ]
        }
    }
);


/* ASSET DATA */

function getAssetData()
{

    let active =
        assets.filter(a=>a.status==="active").length;
    let maintenance =
        assets.filter(a=>a.status==="maintenance").length;
    return [active,maintenance];
}


/* PIE CHART */

const assetsChart = new Chart(
    document.getElementById("assetsChart"),
    {
        type:"pie",
        data:{
            labels:[
                "Active",
                "Maintenance"
            ],
            datasets:[
                {
                    data:getAssetData()
                }
            ]
        }
    }
);


/* UPDATE DASHBOARD */

function updateReports()
{

    calculateMetrics();
    assetsChart.data.datasets[0].data =
        getAssetData();
    assetsChart.update();
    costChart.update();

}
updateReports();

const ctx = document.getElementById('maintenanceChart');
const data = {
    labels: ['Preventivo', 'Correctivo'],
    datasets: [
        {
            label: 'Cantidad',
            data: [3, 2],
            backgroundColor: '#3b82f6'
        },
        {
            label: 'Costo ($)',
            data: [430, 320],
            backgroundColor: '#10b981',
            yAxisID: 'y1'
        }
    ]
};

const config = {
    type: 'bar',
    data: data,
    options: {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Cantidad'
                }
            },
            y1: {
                beginAtZero: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Costo ($)'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    }
};

new Chart(ctx, config);