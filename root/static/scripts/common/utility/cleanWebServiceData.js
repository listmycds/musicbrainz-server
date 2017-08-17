// This file is part of MusicBrainz, the open internet music database.
// Copyright (C) 2014 MetaBrainz Foundation
// Licensed under the GPL version 2, or (at your option) any later version:
// http://www.gnu.org/licenses/gpl-2.0.txt

// Converts JSON from /ws/2 into /ws/js-formatted data. Hopefully one day
// we'll have a standard MB data format and this won't be needed.

const _ = require('lodash');

const {l} = require('../i18n');
const formatDate = require('./formatDate');
const formatTrackLength = require('./formatTrackLength');
const parseDate = require('./parseDate');
const {artistCreditFromArray} = require('../immutable-entities');

function cleanArtistCreditName(data) {
  return {
    artist: {
      gid: data.artist.id,
      name: data.artist.name,
      sortName: data.artist["sort-name"],
      entityType: 'artist',
    },
    name: data.name || data.artist.name,
    joinPhrase: data.joinphrase || ""
  };
}

function cleanArtistCredit(data) {
  return _.map(data, cleanArtistCreditName);
}

function cleanWebServiceData(data) {
  var clean = { gid: data.id, name: data.name || data.title };

  if (data.length) {
    clean.length = data.length;
  }

  if (data['sort-name']) {
    clean.sortName = data['sort-name'];
    clean.sort_name = clean.sortName;
  }

  if (data['artist-credit']) {
    clean.artistCredit = cleanArtistCredit(data['artist-credit']);
    clean.artist_credit = clean.artistCredit;
  }

  if (data.disambiguation) {
    clean.comment = data.disambiguation;
  }

  return clean;
}

function cleanLifeSpan(data, target) {
  const lifeSpan = data['life-span'];
  if (lifeSpan) {
    target.begin_date = parseDate(lifeSpan.begin || '');
    target.begin_date.toString = formatDate.bind(null, target.begin_date);
    target.end_date = parseDate(lifeSpan.end || '');
    target.end_date.toString = formatDate.bind(null, target.end_date);
    target.ended = !!lifeSpan.ended;
  }
}

function cleanType(data, target) {
  if (data.type) {
    target.type = {name: data.type, l_name: l(data.type)};
  }
  if (data.type) {
    target.l_type_name = l(data.type);
  }
}

function cleanWriters(data, target) {
  if (data.relations.length) {
    const filter = ['composer', 'revised by', 'previous attribution', 'orchestrator', 'writer', 'arranger', 'lyricist', 'librettist', 'translator'];
    const filtered = data.relations.filter(f => filter.includes(f.type));
    
    var writers=[];
    var duplicate=[];
    
    if (filtered) {
      for (let writer of filtered) {
        duplicate = writers.filter(f => { return f.entity.gid === writer.artist.id; })[0];
        if (duplicate) {
          duplicate.roles.push(l(writer.type));
        } else {
          writers.push({ entity: cleanArtist(writer.artist), roles: [l(writer.type)]});
        }
      }
    }
    
    target.writers = writers;
  }
}

function cleanLocations(data, target) {
  if (data.relations.length) {
    const filter = ['held at', 'held in']; 
    const locations = data.relations.filter(f => filter.includes(f.type)); 
    
    var places = [];
    var areas = [];
    
    if (locations.length) {
      for (let location of locations) {
        if (location.type === 'held at') { 
          places.push(cleanPlace(location.place));
        }
        if (location.type === 'held in') {
          areas.push(cleanArea(location.area));
        }
      }
    }   
    
    target.places = places; 
    target.areas = areas; 
  } 
}

function cleanPerformers(data, target) {
  if (data.relations.length) {
    const filter = ['main performer', 'conductor', 'orchestra', 'support act', 'guest performer', 'host', 'teacher']; 
    const filtered = data.relations.filter(f => filter.includes(f.type)); 
    
    var performers=[];
    var duplicate=[];
    
    if (filtered) {
      for (let performer of filtered) {
        duplicate = performers.filter(f => { return f.entity.gid === performer.artist.id; })[0];
        if (duplicate) {
          duplicate.roles.push(l(performer.type));
        } else {
          performers.push({ entity: cleanArtist(performer.artist), roles: [l(performer.type)]});
        }
      }
    }
    
    target.performers = performers;
  } 
}

function cleanArea(data) {
  const area = cleanWebServiceData(data);

  area.containment = [];
  area.entity_type = 'area';
  area.entityType = 'area';
  area.iso_3166_1_codes = data['iso-3166-1-codes'] || [];
  area.iso_3166_2_codes = data['iso-3166-2-codes'] || [];
  area.iso_3166_3_codes = data['iso-3166-3-codes'] || [];

  cleanLifeSpan(data, area);
  cleanType(data, area);

  return area;
}

function cleanArtist(data) {
  const artist = cleanWebServiceData(data);

  artist.entity_type = 'artist';
  artist.entityType = 'artist';

  cleanLifeSpan(data, artist);
  cleanType(data, artist);

  let gender = data.gender;
  if (gender) {
    // XXX The search server returns the gender name as lower case.
    gender = _.capitalize(gender);
    artist.gender = {name: gender, l_name: l(gender)};
  }

  ['area', 'begin-area', 'end-area'].forEach(function (key) {
    const areaData = data[key];
    if (areaData) {
      artist[_.snakeCase(key)] = cleanArea(areaData);
    }
  });

  return artist;
}

function cleanEvent(data) {
  const event = cleanWebServiceData(data);

  event.entity_type = 'event';
  event.entityType = 'event';

  cleanType(data, event);
  cleanLocations(data, event);
  cleanLifeSpan(data, event);
  cleanPerformers(data, event);
    
  if (data.time) {
    event.formatted_time = data.time.slice(0, -3);
  }
  
  var tempDate = "";
  
  if (event.begin_date) {
    tempDate = tempDate.concat(event.begin_date.toString());
  }
  if (event.end_date) {
    if (event.begin_date) {
      if (event.end_date.toString() != event.begin_date.toString()) {
        tempDate = tempDate.concat(' - '+event.end_date.toString());
      }
    } else {
      tempDate = tempDate.concat(event.end_date.toString());
    }
  }
  if (tempDate.length) {
    event.formatted_date = tempDate;
  }
  
  return event;
}

function cleanLabel(data) {
  const label = cleanWebServiceData(data);

  label.entity_type = 'label';
  label.entityType = 'label';
  
  cleanType(data, label);
  cleanLifeSpan(data, label);
  
  if (data.area) {
    label.area = cleanArea(data.area);
  }
  
  if (data['label-code']) {
    label.format_label_code = `LC ${data['label-code']}`;
  }
 
  return label;
}

function cleanInstrument(data) {
  const instrument = cleanWebServiceData(data);

  instrument.entity_type = 'instrument';
  instrument.entityType = 'instrument';
  
  cleanType(data, instrument);
  
  if(data.description) {
    instrument.l_description = l(data.description);
  }
 
  return instrument;
}

function cleanPlace(data) {
  const place = cleanWebServiceData(data);

  place.entity_type = 'place';
  place.entityType = 'place';

  cleanType(data, place);
  cleanLifeSpan(data, place);

  if (data.area) {
    place.area = cleanArea(data.area);
  }

  if (data.address) {
    place.address = data.address;
  }

  return place;
}

function cleanRecording(data) {
  const recording = cleanWebServiceData(data);

  recording.entity_type = 'recording';
  recording.entityType = 'recording';

  if (data.video) {
    recording.video = data.video;
  }

  if (data.releases) {
    recording.releases=[];

    for (let release of data.releases) {
      let tempRelease = cleanRelease(release);
      if (release.media[0]) {
         tempRelease.medium = release.media[0].position;
         tempRelease.trackCount = release.media[0]['track-count'];
         tempRelease.position = release.media[0]['track-offset'] + 1;
      }

      let type = "";

      if (release['release-group']['primary-type']) {
         type = type.concat(release['release-group']['primary-type']);
      }
      if (release['release-group']['secondary-types']) {
        if (type.length) {
          type = type.concat(" + ");
        }
        type = type.concat(release['release-group']['secondary-types'].map(x => l(x)).join(" + "));
      }
      if (type.length) {
        tempRelease.groupType = type;
      }

      recording.releases.push(tempRelease);
    }
  }

  if (data.length) {
    recording.length=formatTrackLength(data.length);
  }

  return recording;
}

function cleanRelease(data) {
  const release = cleanWebServiceData(data);
  
  release.entity_type = 'release';
  release.entityType = 'release';
  
  cleanType(data, release);

  if (data.media) {
    let tracks = [];
    let formats = {};
    for (let medium of data.media) {
      tracks.push(medium['track-count']);
      if (medium.format) {
        if (medium.format===undefined) {
          medium.format="(unknown)";
        }
        if (medium.format in formats) {
          formats[medium.format]++;
        }
        else {
          formats[medium.format]=1;
        }
      }
    }
    if (!_.isEmpty(formats)) {
      let combined = "";
      for (var item in formats) {
        if (formats.hasOwnProperty(item) ) {
          if (combined.length) {
            combined+=", ";
          }
          if (formats[item]>1) {
            combined+=formats[item] + "×";
          }
          combined+=l(item);
        }
      }
      if (combined.length) {
          release.combined_format_name = combined;
      }
    }

    if (tracks.length) {
      release.combined_track_count = tracks.join(" + ");
    }
  }
    
  if (data['release-events']) {
    let dates = [];
    let countries = [];
    for (let event of data['release-events']) {
      if (event.date) {
        dates.push(event.date);
      }
      if (event.area) {
        countries.push(cleanArea(event.area));
      }
    }
    if (dates.length) {
      release.dates = dates;
    }
    if (countries.length) {
      release.countries = countries;
    }
  }

  if (data['label-info']) {
    let catNos = [];
    let labels = [];
    for (let info of data['label-info']) {
      if (info['catalog-number']) {
        catNos.push(info['catalog-number']);
      }
      if (!_.isEmpty(info.label)) {
        labels.push(cleanLabel(info.label));
      }
    }

    if (labels.length) {
      release.labels = labels;
    }
    if (catNos.length) {
      release.catNos = catNos.join(", ");
    }
  }

  if (data.barcode) {
    release.barcode = data.barcode;
  }
  
  if (data['text-representation']) {
    if (data['text-representation'].language) {
      release.language = data['text-representation'].language;
    }
    if (data['text-representation'].script) {
      release.script = data['text-representation'].script;
    }
  }
  
  if (data['release-group']) {
    let type = "";
    if (data['release-group']['primary-type']) {
      type = type.concat(data['release-group']['primary-type']);
    }
    if (data['release-group']['secondary-types']) {
      if (type.length) {
        type = type.concat(" + ");
      }
      type = type.concat(data['release-group']['secondary-types'].map(x => l(x)).join(" + "));
    }
    if (type.length) {
      release.groupType = type;
    }
  }
   
  if (data.status) {
    release.l_status_name = l(data.status);
  }

  return release;
}

function cleanRelease_group(data) {
  const group = cleanWebServiceData(data);

  group.entity_type = 'release_group';
  group.entityType = 'release_group';
  
  let type = "";
  if (data['primary-type']) {
    type += data['primary-type'];
  }
  if (data['secondary-types']) {
    if (type.length) {
      type += " + ";
    }
    type += data['secondary-types'].map(x => l(x)).join(" + ");
  }
  if (type.length) {
    group.l_type_name = type;
  }

  return group;
}

function cleanSeries(data) {
  const series = cleanWebServiceData(data);

  series.entity_type = 'series';
  series.entityType = 'series';

  cleanType(data, series);

  return series;
}

function cleanWork(data) {
  const work = cleanWebServiceData(data);

  work.entity_type = 'work';
  work.entityType = 'work';

  cleanType(data, work);
  cleanWriters(data, work);

  if(data.languages) {
    work.languages=data.languages.join(", ");
  }

  return work;
}

function cleanResult(cleanEntity, data) {
  return {entity: cleanEntity(data), score: data.score};
}

function cleanWebServiceResults(results, entityType) {
  switch (entityType) {
    case 'area':
    case 'artist':
    case 'event':
    case 'instrument':
    case 'label':
    case 'place':
    case 'recording':
    case 'release':
    case 'release_group':
    case 'series':
    case 'work':
      return results.map(cleanResult.bind(
        null,
        eval('clean' + _.capitalize(entityType))
      ));
    default:
      return results;
  }
}

exports.cleanArtistCredit = cleanArtistCredit;
exports.cleanWebServiceData = cleanWebServiceData;
exports.cleanWebServiceResults = cleanWebServiceResults;
