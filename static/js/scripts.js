
// GENERAL

$('[data-toggle="tooltip"]').tooltip();

// MAPS

$(".section-filtMap").parent().removeClass("container").addClass("container-fluid");

$("#index-btn-showHideTbl").click(function() {
  $(".section-mapTbl aside").toggleClass("d-lg-block fadedIn fadedOut");
  $("#listing").parent().toggleClass("col-lg-10 transitionAll");
});

function addWorldIcon(filterCountry) {
  if (filterCountry != "") { // use django - countries flag
    $('#flag_id_country').addClass('d-none').removeClass('d-none');
    $('#flag_id_country').next().remove();
  } else { // use font-awesome global map as icon for All Countries display
    $('#flag_id_country').removeClass('d-none').addClass('d-none');
    $('#flag_id_country').after('<i class="fas fa-1x fa-globe" style="margin:6px 4px 0;"></i>');
  }
}

// Country On Change Handling
$('#index-form #id_country').on('change', function(e){
  e.preventDefault();

  // insert World Icon if All Countries filter is Selected
  addWorldIcon($(this).val());

  // zoom to country place if switch country
  onPlaceChanged($(this).val());

  // build Info Content below map
  if ($(this).val() != "") { // if not All Countries filter is selected
    const projsFilter = projects.filter(
      obj => obj.fields.country === $(this).val()
    );
    addResults(projsFilter);
  } else { // if All Countries filter is selected
    addResults(projects);
  };

});

// Font Weight to 100 the disabled phase filter
$('#index-form #id_phase').css({'font-weight': 100});

function initMap() {
  // Insert Map
  const options = {
      zoom: 1,
      center: { // Mediterranean Sea
          "lat": 34.5531,
          "lng": 18.0480
      },
      mapTypeControl: false,
      panControl: false,
      zoomControl: false,
      streetViewControl: false,
      componentRestrictions: { 'country': [] }
  }

  map = new google.maps.Map(document.getElementById("map"), options);

  //add Markers
  addMarkers(projects);

  // insert World Icon if All Countries filter is Selected
  addWorldIcon($('#id_country').val());

  // zoom to country place if switch country
  onPlaceChanged($('#id_country').val());

  // build Info Content below map
  addResults(projects);

};

function MarketClusterClearRemain() { // rm any clustered bg-image that still there
  const patt = /markerclusterer/i;
  const mcRemainders = $("#map div").filter(function() {
    if ($(this).css("background-image").match(patt)) {
      $(this).remove();
    }
  });
  return;
}

// clear current google map's markers and clusters to insert new ones 
function clearMarkers() {
  infowindow = new google.maps.InfoWindow();
  infowindow.close();

  for (let it in markers) {
    markers[it].setVisible(false);
  }

  for (let i = 0; i < markerClusters.length; i++) {
    markerClusters[i].repaint();
    markerClusters[i].removeMarkers(markerClusters[i].getMarkers());
  };

  for (let i = 0; i < markers.length; i++) {
    if (markers[i]) {
      markers[i].setMap(null);
    }
  };

  markers.length = 0;

  for (let i = 0; i < markerClusters.length; i++) {
    markerClusters[i].clearMarkers();
  };

  markerClusters.length = 0;

  MarketClusterClearRemain();
}

function hideAllInfoWindows(map) { // close all info to just open the one selected (marker clicked)
  markers.forEach(function(marker) {
    marker.infowindow.close(map, marker);
  });
}

function addMarkers(projects) {
  clearMarkers();

  let counterLat = 0; counterLng = 0; let j=0;

  // add markers, clusterers and info window on the map
  for (let i = 0; i < projects.length; i++) {
    // switched countries or looping through to the same country still
    if (i>0 && projects[i].fields.country != projects[i-1].fields.country) {
      counterLat = 0; counterLng = 0; j = i;
    } else {
      counterLat+= 0.032; counterLng+= 0.0091;
    }

    // filter projects per country
    let countryLatLng = projectsLatLng.filter(
      obj => obj.fields.name  ===  projects[i].fields.country
    );

    let markerIcon = "http://maps.google.com/mapfiles/ms/icons/";
    markerIcon += phaseDictColours[projects[i].fields.phase] + "-dot.png";
    
    let locationInfowindow = new google.maps.InfoWindow({
      content: genHtmlContent(i),
    });

    // Set Marker
    let marker = new google.maps.Marker({
      position: {
        "lat": parseFloat(countryLatLng[0].fields.latitude) + counterLat,
        "lng": parseFloat(countryLatLng[0].fields.longitude) + counterLng
      },
      animation: google.maps.Animation.DROP,
      icon: markerIcon,
      visible: true,
      infowindow: locationInfowindow
     });
    
    // insert marker to array of markers
    markers.push(marker);
    projects[i]["mk"]= i;
    
    // hook info window and close all opened ones
    google.maps.event.addListener(marker, 'click', function() {
      hideAllInfoWindows(map);
      this.infowindow.open(map, this);
    });

    projects[i]["mkCluster"] = Math.max(0,markerClusters.length - 1);

    // Set Market Clusterer
    if (projects[i].fields.country != projects[i+(i+1==projects.length?-1:1)].fields.country) {
      markerClusters.push(MarketCluster(i,j));
      projects[i]["mkCluster"] = markerClusters.length - 1;

      google.maps.event.addListener(markerClusters[projects[i]["mkCluster"]], 
        'clusterclick', function(cluster) { // mktclusterplus ??
          map.setCenter(cluster.getCenter());
      });

      // set the market clusterer to a drop marker instead if only one country project
      if (projects[i].fields.country != projects[i-1].fields.country) {
        setTimeout(dropMarker(i), i * 100);
      };
    }
    
  }
  return;
}

function MarketCluster(i,j) {
  return markerCluster = new MarkerClusterer(map, markers.slice(j,i+1),
    {
      averageCenter: true,
      maxZoom: 10,
      prevZoom: 10,
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    }
  );
}

function dropMarker(i) {
  return function() {
    markers[i].setMap(map);
  };
}

function onPlaceChanged(filterCtry) {
  if (filterCtry != "") { // Country is Selected
    const countryLatLng = projectsLatLng.filter(
      obj => obj.fields.name  ===  filterCtry
    );
    map.panTo({
        "lat": parseFloat(countryLatLng[0].fields.latitude),
        "lng": parseFloat(countryLatLng[0].fields.longitude)
    });
    map.setZoom(6);
  } else { // if All Countries filter is Selected
    map.setCenter({ "lat": 34.5531, "lng": 18.0480 });
    map.setZoom(3);
  }
}

function genHtmlContent(i) { // info window content pop-up
  const contentstring = `<table><tbody>
  <tr>
  <td>Phase</td>
  <td class="px-1">:</td>
  <td>${projects[i].fields.phase}</td>
  </tr>
  <tr>
  <td>MW</td>
  <td class="px-1">:</td>
  <td>${projects[i].fields.mw}</td>
  </tr>
  <tr>
  <td>Budget Revenue</td>
  <td class="px-1">:</td>
  <td>${projects[i].fields.budget_revenue}</td>
  </tr>
  <tr>
  <td>Budget Cogs</td>
  <td class="px-1">:</td>
  <td>${projects[i].fields.budget_cogs}</td>
  </tr>
  <tr>
  <td>Cash Outflow No Vat</td>
  <td class="px-1">:</td>
  <td>${projects[i].fields.cash_out_no_vat}</td>
  </tr>
  <tr>
  <td>% of Completion</td>
  <td class="px-1">:</td>
  <td>${projects[i].fields.pct_of_completion}</td>
  </tr>
  </tbody><table/>`;

  return contentstring;
}

function rejectFields(obj, keys) { // fields not considered when looping through objects
  return Object.keys(obj)
    .filter(k => !keys.includes(k))
    .map(k => Object.assign({}, {[k]: obj[k]}))
    .reduce((res, o) => Object.assign(res, o), {});
}

function addResults(projsFilterOrAll) { // display table tbody below map to show contents
  let results = document.getElementById('results');
  $("#results").empty();

  for (let i = 0; i < projsFilterOrAll.length; i++) {
    let tr = document.createElement('tr');

    tr.onclick = function() {
      // cond 1: since we play per country, lat and lng should change significantly to understand if we click to a diff country
      const latDelta = Math.abs(markerClusters[projsFilterOrAll[i]["mkCluster"]].map.center.lat()) - Math.abs(markers[projsFilterOrAll[i]["mk"]].position.lat());
      const lngDelta = Math.abs(markerClusters[projsFilterOrAll[i]["mkCluster"]].map.center.lng()) - Math.abs(markers[projsFilterOrAll[i]["mk"]].position.lng());
      // cond 2: assumed that when you are inside a Market Cluster, zoom exceeds 10
      if (map.getZoom() <= 10 || (latDelta + lngDelta) > 1) {onPlaceChanged(projsFilterOrAll[i].fields.country);}
      google.maps.event.trigger(markerClusters[projsFilterOrAll[i]["mkCluster"]].clusters_, 'clusterclick'); // cluster click event
      google.maps.event.trigger(markers[projsFilterOrAll[i]["mk"]], 'click'); // marker click event
    };

    let iconTd = document.createElement('td');
    let icon = document.createElement('img');
    let markerIcon = "http://maps.google.com/mapfiles/ms/icons/";
    markerIcon += phaseDictColours[projsFilterOrAll[i].fields.phase] + "-dot.png";
    icon.src = markerIcon;
    iconTd.appendChild(icon);
    tr.appendChild(iconTd);
    
    $.each(rejectFields(projsFilterOrAll[i].fields,['owner','budget_revenue', 
      'budget_cogs','cash_out_no_vat','pct_of_completion', 'timestamp']), function(key,value){ 
      let tdElem = document.createElement('td');
      let tdTxt = document.createTextNode(value);
      tdElem.appendChild(tdTxt);
      tr.appendChild(tdElem);
    });

    results.appendChild(tr);
  }

  return;
}