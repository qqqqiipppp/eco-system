// Card-slot IDs are stable; taxonomic identity is explicit and versioned.
export const ECOLOGY_REVISION = 2;
const plantList='https://www.nibr.go.kr/aiibook/catImage/20/National%20Species%201.pdf';
const animalList='https://www.nibr.go.kr/aiibook/catImage/21/National%20Species%202.pdf';
const taxon=(scientificName,source,taxonomyNote='',aliases=[])=>({scientificName,taxonKind:'species',taxonomySource:source,taxonomyNote,aliases});
export const speciesTaxonomy={
 oak:taxon('Quercus acutissima',plantList),
 grass:taxon('Setaria viridis',plantList,'한해살이 벼과 식물. 목록의 기본변종 표기와 종 수준 표기를 구분해요.'),
 pine:taxon('Pinus densiflora',plantList),
 raspberry:taxon('Rubus crataegifolius',plantList),
 hazel:taxon('Celtis sinensis',plantList),
 grasshopper:taxon('Acrida cinerea','https://species.nibr.go.kr/kiiks/social/grasshopper.do'),
 frog:taxon('Pelophylax nigromaculatus',animalList,'예전 자료에는 Rana nigromaculata로도 나와요.',['Rana nigromaculata']),
 rabbit:taxon('Lepus coreanus',animalList),
 chipmunk:taxon('Eutamias sibiricus','https://www.mammaldiversity.org/taxon/1001719/','Tamias에서 Eutamias로 옮긴 분류를 사용해요.',['Tamias sibiricus']),
 'field-mouse':taxon('Erinaceus amurensis','https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1116&callmode=admin&catimage=&eclang=ko&start=64&um=s'),
 caterpillar:taxon('Dendrolimus spectabilis','https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=22&callmode=admin&catimage=&eclang=ko&start=506&um=s','이 카드는 솔나방의 유충 시기만 나타내요.'),
 aphid:taxon('Anomala albopilosa','https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=22&callmode=normal&catimage=&eclang=ko&start=272&um=s','이 카드는 성충이에요. 유충의 뿌리 먹이와 구분해요.'),
 snail:taxon('Acusta despecta','https://www.nongsaro.go.kr/portal/ps/pss/pssa/hlsctSearchDtl.ps?hlsctCode=H00000535&menuId=PS00202&pageIndex=1&pageSize=10','농사로의 명주달팽이 표기를 유지해요. 국내 목록의 달팽이 아종과 국제 Acusta sieboldtiana 분리의 국명 대응은 추가 확인이 필요해요.'),
 spider:taxon('Trichonephila clavata','https://wsc.nmbe.ch/spec-data/29057','현재 World Spider Catalog의 속 이름을 사용해요.',['Nephila clavata']),
 ladybird:taxon('Carabus smaragdinus','https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=120930&mode=Info','자료마다 속의 처리 방식이 달라요. 같은 생물을 가리키는 이름들을 함께 기록해요.',['Coptolabrus smaragdinus','Damaster smaragdinus']),
 tit:taxon('Parus minor','https://www.rinya.maff.go.jp/chubu/policy/business/conservation/corridor/sizyuukara.html','과거 넓은 Parus major 분류와 구분해요.'),
 bulbul:taxon('Hypsipetes amaurotis','https://www.nibr.go.kr/aiibook/access/ecatalogt.jsp?Dir=1403&callmode=admin&catimage=&eclang=ko&start=168&um=s','Microscelis 표기를 쓰는 예전 자료도 있어요.',['Microscelis amaurotis']),
 snake:taxon('Rhabdophis tigrinus',animalList),
 weasel:taxon('Mustela sibirica',animalList),
 goshawk:taxon('Astur gentilis','https://www.worldbirdnames.org/updates/taxonomy/','IOC의 속 변경을 반영해요. 북미 참매와 구분해요.',['Accipiter gentilis']),
 mushroom:taxon('Trametes versicolor',plantList,'목재를 분해하는 균사체와 자실체를 포함한 군집이에요.',['Coriolus versicolor']),
 'litter-mold':{scientificName:null,taxonKind:'functional-group',taxonomySource:'https://www.nrcs.usda.gov/state-offices/illinois/soil-tech-note-11a-biological-underground-community',taxonomyNote:'여러 낙엽 분해 균류를 묶은 기능군이며 단일 종이 아니에요.',aliases:[]},
 'soil-bacteria':taxon('Bacillus subtilis','https://www.nongsaro.go.kr/portal/ps/psq/psqb/farmTermSimpleDicLst.ps?menuId=PS00064&sWordNm=%EA%B3%A0%EC%B4%88%EA%B7%A0&searchTagWord=%EA%B3%A0%EC%B4%88%EA%B7%A0','고초균 한 세포가 아니라 같은 종의 군집을 나타내요.'),
};
export const changedSpeciesIds=new Set(['grass','grasshopper','frog','rabbit','mushroom','hazel','field-mouse','caterpillar','aphid','snail','spider','ladybird','soil-bacteria']);
// Annual plant, long-lived tree, different animals/stages need age conversion.
export const convertedLifeIds=new Set(['grass','hazel','field-mouse','caterpillar','aphid','spider','ladybird']);
export const changedDietIds=new Set(['field-mouse','caterpillar','aphid','spider','ladybird']);
