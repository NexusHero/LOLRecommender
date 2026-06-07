const _kVersion = '15.12.1';
const _kBase = 'https://ddragon.leagueoflegends.com/cdn/$_kVersion/img';

const _kChampOverrides = <String, String>{
  'Wukong': 'MonkeyKing',
  'Nunu & Willump': 'Nunu',
  'Renata Glasc': 'Renata',
};

String champImageUrl(String name) {
  final key = _kChampOverrides[name] ??
      name
          .replaceAll("'", '')
          .replaceAll('.', '')
          .replaceAll(' & ', '')
          .replaceAll(' ', '');
  return '$_kBase/champion/$key.png';
}

String itemImageUrl(int itemId) => '$_kBase/item/$itemId.png';
