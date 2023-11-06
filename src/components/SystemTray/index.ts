import SysTray, { ClickEvent, MenuItem } from 'systray2';

import { ModelType } from 'types/common';
import { ItemEventMap } from 'components/SystemTray/types';

interface MenuItemClickable extends MenuItem {
  click?: () => Promise<void>;
  items?: MenuItemClickable[];
  type?: ModelType;
}

interface ClickableClickEvent extends ClickEvent {
  item: MenuItemClickable;
}

const radioConfigs: {
  title: string;
  tooltip: string;
  modelType: ModelType;
}[] = [
  {
    title: 'CmwCoder 1.0',
    tooltip: 'CMW 模型',
    modelType: 'CMW',
  },
  {
    title: 'CmwCoder 2.0',
    tooltip: 'CODELLAMA 模型',
    modelType: 'CODELLAMA',
  },
  {
    title: '百业灵犀',
    tooltip: 'LINSEER 13B 模型',
    modelType: 'LS13B',
  },
];

export class SystemTray {
  private modelType: ModelType;
  private systray: SysTray;

  private readonly modelItems: MenuItemClickable[];

  private _handlerMap = new Map<keyof ItemEventMap, any>();

  constructor(modelType: ModelType = 'CMW', availableModels: ModelType[]) {
    this.modelType = modelType;
    this.modelItems = radioConfigs
      .filter((radioConfig) => availableModels.includes(radioConfig.modelType))
      .map((radioConfig) =>
        this.constructRadioItem(
          radioConfig.title,
          radioConfig.tooltip,
          radioConfig.modelType,
        ),
      );
    this.systray = new SysTray({
      menu: {
        icon: 'AAABAAMAEBAAAAEAIABoBAAANgAAACAgAAABACAAKBEAAJ4EAAAwMAAAAQAgAGgmAADGFQAAKAAAABAAAAAgAAAAAQAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8x////l////9n////5////+f///9n///+X////MQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wn///+a/////v///////////f39/+De2/+5qpv/r5qJ/9PIwf7///+a////CQAAAAAAAAAAAAAAAP///wn////B////////////////6+vq/52NbP90ThX/bUAN/2o2C/9mLQz/spOK/////8H///8JAAAAAAAAAAD///+a////////////////397Y/4ZxL/90Ug3/cUkM/3RJGP+SbEz/hVc9/2YnFv/y7ez/////mgAAAAD///8x/////v//////////5+bi/4d1J/94XQP/dVMP/7CbeP/29PH///////////+lg3v/1cLA//////7///8x////l///////////+Pj4/5eNS/97ZgD/eV8F/83CqP//////////////////////39jX/9XDwf//////////l////9n//////////8PApP9/cAD/e2YA/8G1iv////////////39/f/y8vL//v7+/+7r6//u5+b//////////9n////5//////j4+P+Ohy//f3AA/5iHN//+/v3///////7+/v+qonv/mYRc/6yUhv/28/P////////////////5////+f/////Y2Mn/gXkB/39wAP/Z07X////////////29vb/hHcU/6WVbP9sOBH/6uLh////////////////+f///9n/////vLuN/4F5AP+IehH//f38/////////////v7+/52VQP+wom//glgx/+Ta1v///////////////9n///+X/////7Kwc/+BeQD/nJE5///////////////////////19Ov/wbaN//Hu6v////////////////////+X////Mf////6+vIj/gXkA/5aKLv//////////////////////+fn4//z8+//////////////////////+////MQAAAAD///+a6OjY/4N7Bf9/cAH/19G3//39/f/09PT/3NfP//Ds6P//////////////////////////mgAAAAAAAAAA////Cf///8HSz6b/iXsU/3xnAv+QfT3/uayP//Lu6P//////////////////////////wf///wkAAAAAAAAAAAAAAAD///8J////mv39/P729O3//v7+///////////////////////////+////mv///wkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8x////l////9n////5////+f///9n///+X////MQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAACAAAABAAAAAAQAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8P////Wv///5z////M////7P////z////8////7P///8z///+c////Wv///w8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8m////nv////b/////////////////////////////////////////////////////////9v///57///8mAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8K////jf////r///////////////////////////////////////////7+/v/09PT/6Ojo/+Tk5P/s7Oz/+/v7//////r///+N////CgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////Jf///9T///////////////////////////////////////////n5+f/Y2Nj/rKSY/4t0Wf98Wjf/dkwn/3ZMLP+KaVL/yr64//39/f/////U////JQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///zH////r//////////////////////////////////////39/f/b29v/oZiG/31fLv9wRwz/b0IN/2w+Dv9rOQz/aTQL/2cwC/9mKw7/poZ7//7+/v/////r////MQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8l////6//////////////////////////////////////29vb/vLq1/4ZxQv9zUQ7/ckwN/3BHDP9vQg3/bD4O/2s5DP9pNAv/ZzAL/2YqDf9kJRD/v6Wg///////////r////JQAAAAAAAAAAAAAAAAAAAAAAAAAA////Cv///9T/////////////////////////////////////7+/v/6mkk/99Yxr/dVUN/3NQDv9yTA3/cEcM/29CDf9sPg7/azkM/2k0C/9nMAv/ZioN/2QlEP9wMyb/+vj4///////////U////CgAAAAAAAAAAAAAAAAAAAAD///+N/////////////////////////////////////+3t7f+jnYT/fGMJ/3daBv91VQ3/c1AO/3JMDf9wRwz/b0IN/4dhOv+wlX3/w62d/7qhkP+NYEv/ZCUQ/2IhEv/Rvrv///////////////+NAAAAAAAAAAAAAAAA////Jv////r////////////////////////////////y8vL/paCJ/31mB/95YAD/d1oG/3VVDf9zUA7/ckwN/5FxQ//d08b///////////////////////////+2nJT/YiET/7KQjP////////////////r///8mAAAAAAAAAAD///+e////////////////////////////////+vr6/7Gun/9/bAz/e2QA/3lgAP93Wgb/dVUN/3ZUE//AsJP//v79//////////////////////////////////z8/P+BU0r/o3x4/////////////////////54AAAAA////D/////b///////////////////////////7+/v/Hx8P/hXce/3xoAP97ZAD/eWAA/3daBv99Xhr/29LB/////////////////////////////////////////////////7GcmP+kfnn/////////////////////9v///w////9a////////////////////////////////5eXl/5GJSv9+bgD/fGgA/3tkAP95YAD/fWEQ/9/Yx///////////////////////////////////////////////////////zsbF/7OSjv//////////////////////////Wv///5z///////////////////////////v7+/+sqpP/gHMC/35uAP98aAD/e2QA/3phAv/Uy7H////////////////////////////////////////////////////////////d2tn/zLaz//////////////////////////+c////zP//////////////////////////2tra/4qCKP+AcgD/fm4A/3xoAP97ZAD/tqh1//////////////////////////////////b29v/g4OD/6+vr//39/f///////////97W1f/w6ej//////////////////////////8z////s//////////////////////z8/P+qp4n/gXcA/4ByAP9+bgD/fGgA/5B8KP/7+vj////////////////////////////n5+f/n5d7/39kLP+ji2z/z8vJ/+/t7P/+/v7/6uPi////////////////////////////////7P////z/////////////////////5eXl/42IM/+BdwD/gHIA/35uAP98aAD/2NK1////////////////////////////+/v7/6ekiP98ZgL/gmUg/8C8t/9xQx7/g1ZF//by8v/7+fn////////////////////////////////8/////P/////////////////////Dw7n/gnwD/4F3AP+AcgD/fm4A/5iINv/////////////////////////////////t7e3/jIUz/31pAP+ij1T/pJWB/2w7DP9xOh//+vn5//////////////////////////////////////z////s/////////////////Pz8/6Khcf+CewD/gXcA/4ByAP9+bgD/z8eh/////////////////////////////////+3t7f+Igx7/fm0A/6iXWv+omID/bT4N/2cuDP+xk4z/////////////////////////////////////7P///8z////////////////y8vL/kY8//4J7AP+BdwD/gHIA/4JyB//49/L/////////////////////////////////+/v7/5mVQv9/cAD/lYI0/83FuP9uQQ3/aTIL/66OhP/////////////////////////////////////M////nP///////////////+Xl5f+KhyD/gnsA/4F3AP+AcgD/nZE8////////////////////////////////////////////2tm9/4F1A/98ZQH/4t3P/6GGZP+PaUr/5dvX/////////////////////////////////////5z///9a////////////////3d3d/4aDDf+CewD/gXcA/4ByAP+zqmn/////////////////////////////////////////////////19Kv/4x6IP+Eayb/1Mu9//Xy8P//////////////////////////////////////////Wv///w/////2///////////f39//hYIF/4J7AP+BdwD/gHIA/722ff/////////////////////////////////////////////////////////+//f18f/+/v7///////////////////////////////////////////b///8PAAAAAP///57//////////+jo6P+HhBH/gnsA/4F3AP+AcgD/uLB0//////////////////////////////////////////////////39/f/7+/r/////////////////////////////////////////////////////ngAAAAAAAAAA////Jv////r/////+Pj4/5GOMP+CewD/gXcA/4ByAP+hlkX////////////////////////////////////////////5+fn/8e/t//j29f////////////////////////////////////////////////r///8mAAAAAAAAAAAAAAAA////jf//////////tLN7/4J7AP+BdwD/gHIA/4BwBP/q6Nr////////////////////////////9/f3/6+vr/93Wz//y7ur/////////////////////////////////////////////////////jQAAAAAAAAAAAAAAAAAAAAD///8K////1P/////v7+j/ioMU/4F3AP+AcgD/fm4A/5GALf/h39b/+vr6//z8/P/09PT/3t7e/8S+tf/DtZ//8u/q/////////////////////////////////////////////////////9T///8KAAAAAAAAAAAAAAAAAAAAAAAAAAD///8l////6//////b2bv/hXwK/4ByAP9+bgD/fGgA/35oCv+PgEX/lohg/458VP+Sek7/y72l//7+/v/////////////////////////////////////////////////////r////JQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8x////6//////p59P/pZxM/4FxBf98aAD/e2QA/35lCf+chkj/y7+j//v6+P//////////////////////////////////////////////////////////6////zEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8l////1P//////////+vr2/+zp2v/u697//Pz6/////////////////////////////////////////////////////////////////////9T///8lAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8K////jf////r///////////////////////////////////////////////////////////////////////////////r///+N////CgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////Jv///57////2//////////////////////////////////////////////////////////b///+e////JgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///w////9a////nP///8z////s/////P////z////s////zP///5z///9a////DwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKAAAADAAAABgAAAAAQAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wL///8R////I////0v///+G////tv///9n////w/////P////z////w////2f///7b///+G////S////yP///8R////AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8E////Mv///3b///+y////5v///////////////////////////////////////////////////////////////////+b///+y////dv///zP///8EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///x////+e////4/////r/////////////////////////////////////////////////////////////////////////////////////////+v///+P///+e////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wH///8U////dP////P//////////////////////////////////////////////////////////////////////v7+//z8/P/5+fn/9vb2//X19f/29vb/+vr6//39/f//////////8////3T///8V////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///z////+4////+v////////////////////////////////////////////////////////////////39/f/x8fH/3t7e/83Ly/+6s63/q5+S/6WVhv+nloj/sqOY/8nBvP/p6Of//Pz8//////r///+4////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8B////Zf///+j////+///////////////////////////////////////////////////////////+/v7/7+/v/8vLy/+uq6X/k4Fn/31bMv90TSH/cUYa/29BFv9uPRX/bjwX/3FBIP+FXUX/xLex//v7+//////+////6P///2X///8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wf///9w////9P///////////////////////////////////////////////////////////v7+//T09P/R0M//p6Ob/4x4WP92URn/cEYM/3BDDf9tQA7/bD0O/2w6Df9qNwz/aTML/2gxC/9mLQv/ZysR/6WIff/z8O////////////T///9w////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////Af///3D////t///////////////////////////////////////////////////////////6+vr/4ODg/7azrf+QgGD/elwj/3NNDf9xSQz/cEYM/3BDDf9tQA7/bD0O/2w6Df9qNwz/aTML/2gxC/9mLQv/ZikO/2ktGP+ri4L/+Pb1///////////t////cP///wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////Zf////T///////////////////////////////////////////////////////////n5+f/Pz8//o52N/39mK/92VRT/c1AO/3NNDf9xSQz/cEYM/3BDDf9tQA7/bD0O/2w6Df9qNwz/aTML/2gxC/9mLQv/ZikO/2UmEP9sLx//1cTA////////////////9P///2UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wH///8/////6P//////////////////////////////////////////////////////////9fX1/8TDwf+XjG3/el8T/3ZWDP90UhD/c1AO/3NNDf9xSQz/cEYM/3BDDf9tQA7/bD0O/2w6Df9qNwz/aTML/2gxC/9mLQv/ZikO/2UmEP9jIxH/hVJI//z7+////////////////+j///8/////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///xX///+4/////v////////////////////////////////////////////////7+/v/t7e3/vb25/5CEVf98Yg//d1kH/3ZWDP90UhD/c1AO/3NNDf9xSQz/cEYM/3BDDf9tQA7/bD0O/2w7Dv9yQhn/eUkl/3NAHf9oLw7/ZikO/2UmEP9jIxH/YyEU/9rKyP////////////////7///+4////FgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///3T////6//////////////////////////////////////////////////////Pz8/+7urb/jX5D/3tiBf94XQL/d1kH/3ZWDP90UhD/c1AO/3NNDf9xSQz/cEYM/3BDDf95TyH/p4pu/9TGuf/o4Nn/6+Tf/+nh2//Uw7r/k2lX/2UmEP9jIxH/YiAT/6iCff/////////////////////6////dAAAAAAAAAAAAAAAAAAAAAAAAAAA////H/////P/////////////////////////////////////////////////////9vb2/729uf+Pg07/fGUE/3phAP94XQL/d1kH/3ZWDP90UhD/c1AO/3NNDf9zTBD/gVsn/7Sdgf/x7ej//////////////////////////////////v7+/7ujmv9sMCD/YiAT/4ZRS//+/v7/////////////////////8////x8AAAAAAAAAAAAAAAD///8E////nv/////////////////////////////////////////////////////29vb/xcXF/5OJWf9+aQj/e2MA/3phAP94XQL/d1kH/3ZWDP90UhD/c1AO/3lVGP+rk2//5t7U//////////////////////////////////////////////////f19f+khH3/ZSUY/3k/Of/39PT//////////////////////////57///8EAAAAAAAAAAD///8y////4/////////////////////////////////////////////////z8/P/S0tL/mZJp/35sB/98ZgD/e2MA/3phAP94XQL/d1kH/3ZWDP90UhD/e1ob/9DDrv/59/T////////////////////////////////////////////////////////////Y0M//cDYs/3c9Nv/x7Oz//////////////////////////+P///8zAAAAAP///wL///92////+v///////////////////////////////////////////////+Xl5f+loYj/gnEQ/31pAP98ZgD/e2MA/3phAP94XQL/d1kH/3dXDf+Lbzb/4trN///////////////////////////////////////////////////////////////////////w8PD/iF9X/3c9Nv/y7e3///////////////////////////r///92////Av///xH///+y////////////////////////////////////////////////8/Pz/7W0q/+KfzD/fm0B/31pAP98ZgD/e2MA/3phAP94XQL/d1kH/492Of/f18j//v7+///////////////////////////////////////////////////////////////////////4+Pj/oouH/3pAOv/59vb///////////////////////////////+y////Ef///yP////m///////////////////////////////////////////8/Pz/ysrK/5SNWP+AcQP/fm0A/31pAP98ZgD/e2MA/3phAP94XQL/h20k/+nk2P/+/v7////////////////////////////////////////////////////////////////////////////7+/v/uK2s/4dTTP///v7////////////////////////////////m////I////0v///////////////////////////////////////////7+/v/l5eX/pqWP/4F0Bf9/cAD/fm0A/31pAP98ZgD/e2MA/3phAP+Hbh3/4tvK///////////////////////////////////////////////////////////////////////////////////////7+/v/ycPD/6J6df//////////////////////////////////////////S////4b///////////////////////////////////////////n5+f/Cwrr/jIQv/4BzAP9/cAD/fm0A/31pAP98ZgD/e2MA/4BoDP/HvJf//Pz6//////////////////////////////////////////////////7+/v/+/v7////////////////////////////5+fn/08rJ/8auq///////////////////////////////////////////hv///7b//////////////////////////////////////////+jo6P+gnXP/g3kJ/4BzAP9/cAD/fm0A/31pAP98ZgD/e2MA/6eXWf/6+fX////////////////////////////////////////////9/f3/6urq/8/Pz//Nzc3/5+fn//v7+//////////////////39/f/0cK///Dq6f//////////////////////////////////////////tv///9r//////////////////////////////////////f39/8LBuv+NhzX/gXYA/4BzAP9/cAD/fm0A/31pAP98ZgD/inUe//Ty6/////////////////////////////////////////////n5+f/Pz83/o5+P/4p3Tv+BYjL/oohq/9fQyv/s6un//Pz8///////4+Pj/3tHQ////////////////////////////////////////////////2v////D/////////////////////////////////////7Ozs/6Ohhv+EfAv/gXYA/4BzAP9/cAD/fm0A/31pAP+BbAr/0smo/////////////////////////////////////////////v7+/9fW1f+clXH/f2gS/3ZXC/+Yf1L/wr+6/5yLfv+cgnT/z8C8///////7+/v/8Orp////////////////////////////////////////////////8P////z////////////////////////////////+/v7/zc3N/5GMQ/+BeQD/gXYA/4BzAP9/cAD/fm0A/31pAP+jlEz/9vTt////////////////////////////////////////////9vb2/6yqnP+EdRn/e2QA/35hE/+7rpX/pp2T/29BFv9qNBH/eUU1/+fd3P/+/f3//fz8/////////////////////////////////////////////////P////z////////////////////////////////19fX/tLOs/4N+CP+BeQD/gXYA/4BzAP9/cAD/fm0A/4NwC//Px6L/////////////////////////////////////////////////5OTk/5eTYv9/cQD/fGYA/4VtHf/IwrL/j3ha/208Df9pMgv/cz0n//f09P///////////////////////////////////////////////////////////P////D////////////////////////////////l5eX/n55u/4J8AP+BeQD/gXYA/4BzAP9/cAD/fm0A/5SDLf/y8Of/////////////////////////////////////////////////3Nzc/46KOf+AcwD/fGgA/4lyIP/QzMD/iG1G/20/Dv9pNAv/cTsh/9LEwf/8+vr/////////////////////////////////////////////////////8P///9r///////////////////////////7+/v/W1tb/j400/4J8AP+BeQD/gXYA/4BzAP9/cAD/fm0A/72zfv//////////////////////////////////////////////////////5OTk/46LM/+AdQD/fWsA/4lzHv/W0cP/jXRN/25BDf9qNwz/ZiwN/39LPv/q4eD/////////////////////////////////////////////////////2v///7b///////////////////////////v7+//Gxbr/iIUX/4J8AP+BeQD/gXYA/4BzAP9/cAD/gG8E/+zp3P//////////////////////////////////////////////////////9vb2/56cWf+BdwD/fm4A/4VwFf/Vz7f/ppR6/29DDf9rOQz/aC8M/4BOPf/w6un/////////////////////////////////////////////////////tv///4b///////////////////////////j4+P+3tpn/hoMP/4J8AP+BeQD/gXYA/4BzAP9/cAD/l4ky/////////////////////////////////////////////////////////////v7+/87NsP+Gfg3/f3AA/39pB//Ctoz/3dnS/3xWI/9sPA3/dEIf/6N/cv/9/f3/////////////////////////////////////////////////////hv///0v///////////////////////////X19f+srID/hYEJ/4J8AP+BeQD/gXYA/4BzAP9/cAD/ubB0//////////////////////////////////////////////////////////////////b28f+tqGH/gHMC/3xoAP+XhD7/7uvk/9PGtv+Oakb/rI97/+jf2///////////////////////////////////////////////////////////S////yP////m//////////////////////Pz8/+lpG//hIEF/4J8AP+BeQD/gXYA/4BzAP9/cAD/0cym///////////////////////////////////////////////////////////////////////y8OX/qJ5R/4VzEP96YQT/m4le/93Z0v/z8e7/7+ro///////////////////////////////////////////////////////////m////I////xH///+y//////////////////////Ly8v+ioWX/hIAC/4J8AP+BeQD/gXYA/4BzAP9/cAD/4d7F////////////////////////////////////////////////////////////////////////////+vr1/9XPrv+7rn7/s6F3/9LGsv/08e3//v7+//////////////////////////////////////////////////////////+y////Ef///wL///92////+v////////////////T09P+ko2f/hIAC/4J8AP+BeQD/gXYA/4BzAP9/cAH/5+XQ///////////////////////////////////////////////////////////////////////////////////////+/f3//Pz6//////////////////////////////////////////////////////////////////////r///92////AgAAAAD///8z////4/////////////////b29v+sq3X/hIAF/4J8AP+BeQD/gXYA/4BzAP9/cAD/4uDH/////////////////////////////////////////////////////////////////////////////v7+//z8/P/+/v7//////////////////////////////////////////////////////////////////////////+P///8yAAAAAAAAAAD///8E////nv////////////////r6+v+5uI3/hYIK/4J8AP+BeQD/gXYA/4BzAP9/cAD/0Muk///////////////////////////////////////////////////////////////////////8/Pz/+Pj4//Xz8v/8/Pv//////////////////////////////////////////////////////////////////////////57///8EAAAAAAAAAAAAAAAA////H/////P///////////39/f/NzbP/iYUT/4J8AP+BeQD/gXYA/4BzAP9/cAD/rqRg//////////////////////////////////////////////////////////////////r6+v/x8fH/6uTg//j29f////7/////////////////////////////////////////////////////////////////////8////x8AAAAAAAAAAAAAAAAAAAAAAAAAAP///3T////6///////////o6OP/kpAr/4J8AP+BeQD/gXYA/4BzAP9/cAD/hHQM/+/t4//////////////////////////////////////////////////8/Pz/8fHx/+Lg3v/h2tH/9fHu///////////////////////////////////////////////////////////////////////////6////dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///xb///+4/////v/////7+/v/uriI/4J8AP+BeQD/gXYA/4BzAP9/cAD/fm0A/6eaV//w7uj//////////////////////////////////Pz8/+zs7P/e3dz/y8K1/9fMvv/w7Of///////////////////////////////////////////////////////////////////////////7///+4////FQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wH///8/////6P//////////8vLu/5iTN/+BeQD/gXYA/4BzAP9/cAD/fm0A/4BtBv+jllz/3NvW//T09P/6+vr/+fn5//Hx8f/e3t7/xcXF/8C7s/+qlnb/1sq6//j28////////////////////////////////////////////////////////////////////////////////+j///8/////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////Zf////T//////////+Tj0P+Siyb/gXcB/4BzAP9/cAD/fm0A/31pAP98ZgD/g3Ad/5mPZv+ooo//qaSX/6Gaiv+Vh2z/kntQ/5l/Uf/k3ND////+////////////////////////////////////////////////////////////////////////////////9P///2UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////Af///3D////t//////39/P/d273/oJc//4BzAP9/cAD/fm0A/31pAP98ZgD/e2MA/3phAP95XgT/eVwL/39iHP+jjWD/0MOt//n49f/////////////////////////////////////////////////////////////////////////////////////t////cP///wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wf///9w////9P/////+/v7/8/Lo/83JnP+YjDL/gG4D/31pAP98ZgD/e2MA/3xjBf+Vfzj/v7GK/+jj1//39fL///7+//////////////////////////////////////////////////////////////////////////////////////T///9w////BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8B////Zf///+j////+//////////////7/8vHm/+Hcxf/d177/5eHO//j38v/////////////////////////////////////////////////////////////////////////////////////////////////////+////6P///2X///8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///z////+4////+v////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////r///+4////PwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wH///8V////dP////P/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8////3T///8U////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///x////+e////4/////r/////////////////////////////////////////////////////////////////////////////////////////+v///+P///+e////HwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///8E////M////3b///+y////5v///////////////////////////////////////////////////////////////////+b///+y////dv///zL///8EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wL///8R////I////0v///+G////tv///9r////w/////P////z////w////2v///7b///+G////S////yP///8R////AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
        title: 'CMW Coder',
        tooltip: 'CMW Coder V0.6.3',
        items: [
          {
            title: 'CMW Coder V0.6.3',
            tooltip: '当前模型：',
            enabled: false,
          },
          SysTray.separator,
          {
            title: '切换后端模型',
            tooltip: '当前模型：',
            enabled: true,
            items: this.modelItems,
          },
          SysTray.separator,
          {
            title: '退出',
            tooltip: '退出 CMW Coder 后端',
            enabled: true,
            click: async () => {
              await this._handlerMap.get('exitItemClick')?.({ code: 0 });
              await this.systray.kill();
            },
          } as MenuItemClickable,
        ],
      },
      copyDir: './traybin',
    });

    this.systray
      .onClick((action: ClickableClickEvent) => action.item.click?.())
      .then();
  }

  on<T extends keyof ItemEventMap>(
    eventType: T,
    listener: (event: ItemEventMap[T]) => Promise<void>,
  ) {
    this._handlerMap.set(eventType, listener);
  }

  private constructRadioItem(
    title: string,
    tooltip: string,
    modelType: ModelType,
  ): MenuItemClickable {
    return {
      title,
      tooltip,
      type: modelType,
      checked: this.modelType == modelType,
      enabled: true,
      click: async () => await this.radioItemClick(modelType),
    };
  }

  private async radioItemClick(modelType: ModelType) {
    this.modelType = modelType;
    await Promise.all(
      this.modelItems.map(async (item) => {
        await this.systray.sendAction({
          type: 'update-item',
          item: { ...item, checked: item.type == modelType },
        });
      }),
    );
    await this._handlerMap.get('modelItemClick')?.({ modelType });
  }
}
